"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FraudService = void 0;
class FraudService {
    /**
     * Runs fraud detection rules against a completed task and records any violations.
     */
    static async detectAndRecord(client, task) {
        const rules = [];
        // Rule 1: Missing after-wash photo
        if (!task.after_wash_image_url) {
            rules.push('missing_photo');
        }
        // Rule 2: Duplicate Photo (Before and after are identical)
        if (task.before_wash_image_url && task.after_wash_image_url &&
            task.before_wash_image_url === task.after_wash_image_url) {
            rules.push('duplicate_photo');
        }
        // Rule 3: Too fast completion (Under 30% of expected time)
        if (task.started_at && task.completed_at) {
            const vehicleRes = await client.query('SELECT wash_time FROM vehicles WHERE type = $1', [task.car_type]);
            if (vehicleRes.rows.length > 0 && vehicleRes.rows[0].wash_time) {
                const expectedMs = vehicleRes.rows[0].wash_time * 60 * 1000;
                const actualDuration = new Date(task.completed_at).getTime() - new Date(task.started_at).getTime();
                if (actualDuration < expectedMs * 0.3) {
                    rules.push('too_fast');
                }
            }
        }
        // Rule 4: Duplicate vehicle (Same plate within 2 hours)
        if (task.car_number) {
            const duplicateRes = await client.query(`SELECT id FROM tasks 
                 WHERE car_number = $1 
                 AND id != $2 
                 AND status = 'completed'
                 AND completed_at >= NOW() - INTERVAL '2 hours'`, [task.car_number, task.id]);
            if (duplicateRes.rows.length > 0) {
                rules.push('duplicate_vehicle');
            }
        }
        // Rule 5: Location Mismatch (Task location far from building)
        if (task.latitude && task.longitude) {
            const buildingRes = await client.query(`SELECT latitude, longitude, radius FROM buildings 
                 JOIN cleaners ON buildings.id = cleaners.building_id
                 WHERE cleaners.id = $1`, [task.cleaner_id]);
            if (buildingRes.rows.length > 0) {
                const { latitude: blat, longitude: blon, radius } = buildingRes.rows[0];
                if (blat && blon) {
                    const distance = this.calculateDistance(task.latitude, task.longitude, blat, blon);
                    const threshold = (radius || 500) / 1000; // Radius in KM (default 500m)
                    if (distance > threshold) {
                        rules.push('location_mismatch');
                    }
                }
            }
        }
        // Record identified violations
        for (const type of rules) {
            await client.query(`INSERT INTO fraud_cases (task_id, cleaner_id, type) 
                 VALUES ($1, $2, $3)
                 ON CONFLICT (task_id, type) DO NOTHING`, [task.id, task.cleaner_id, type]);
        }
    }
    static calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in KM
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
exports.FraudService = FraudService;
