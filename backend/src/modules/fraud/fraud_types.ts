export type FraudType = 'missing_photo' | 'too_fast' | 'duplicate_vehicle' | 'duplicate_photo' | 'location_mismatch';

export interface FraudCase {
    id: string;
    task_id: string;
    cleaner_id: string;
    type: FraudType;
    status: 'pending' | 'resolved' | 'escalated';
    created_at: Date;
    resolved_at?: Date;
    resolved_by?: string;
}
