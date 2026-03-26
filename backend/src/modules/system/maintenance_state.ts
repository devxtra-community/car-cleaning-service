export let isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true';

export const setMaintenanceMode = (active: boolean) => {
    isMaintenanceMode = active;
};
