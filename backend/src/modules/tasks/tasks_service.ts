import { pool } from '../../database/connectDatabase';

interface TaskInput {
  owner_name: string;
  owner_phone: string;
  car_number: string;
  car_model: string;
  car_type: string;
  car_color: string;
  car_image_url: string | null;
  cleaner_id: string;
  task_amount: number;
  latitude?: number;
  longitude?: number;
}

// Calculate distance between two GPS coordinates (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

export const createTaskService = async (data: TaskInput) => {
  // GPS validation if coordinates provided
  if (data.latitude !== undefined && data.longitude !== undefined) {
    // Get worker's building location
    const buildingQuery = `
      SELECT b.latitude, b.longitude, b.radius, b.building_name
      FROM cleaners c
      JOIN buildings b ON c.building_id = b.id
      WHERE c.id = $1
    `;
    const buildingResult = await pool.query(buildingQuery, [data.cleaner_id]);

    if (buildingResult.rows.length === 0) {
      throw new Error('No building assigned to worker');
    }

    const building = buildingResult.rows[0];

    if (!building.latitude || !building.longitude) {
      throw new Error('Building does not have GPS coordinates set');
    }

    // Calculate distance
    const distance = calculateDistance(
      building.latitude,
      building.longitude,
      data.latitude,
      data.longitude
    );

    // Check if within radius (default 100m)
    const allowedRadius = building.radius || 100;
    if (distance > allowedRadius) {
      throw new Error(
        `You must be within ${allowedRadius}m of ${building.building_name} to create tasks. Current distance: ${Math.round(distance)}m`
      );
    }
  }

  const result = await pool.query(
    `
    INSERT INTO tasks (
      owner_name,
      owner_phone,
      car_number,
      car_model,
      car_type,
      car_color,
      car_image_url,
      cleaner_id,
      task_amount
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *
    `,
    [
      data.owner_name,
      data.owner_phone,
      data.car_number,
      data.car_model,
      data.car_type,
      data.car_color,
      data.car_image_url,
      data.cleaner_id,
      data.task_amount,
    ]
  );

  return result.rows[0];
};
