"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const logger_1 = require("./config/logger");
const connectDatabase_1 = require("./database/connectDatabase");
const error_handler_1 = require("./middlewares/error-handler");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const auth_routes_1 = __importDefault(require("./modules/auth/auth_routes"));
const vechicleRoutes_1 = __importDefault(require("./modules/vehicles/vechicleRoutes"));
const attendance_routes_1 = __importDefault(require("./modules/attendance/attendance_routes"));
const salary_routes_1 = __importDefault(require("./modules/salary/salary_routes"));
const tasks_routes_1 = __importDefault(require("./modules/tasks/tasks_routes"));
const workers_routes_1 = __importDefault(require("./modules/Worker/workers_routes"));
const buildings_routes_1 = __importDefault(require("./modules/buildings/buildings_routes"));
const incentives_routes_1 = __importDefault(require("./modules/incentives/incentives_routes"));
const analytic_routes_1 = __importDefault(require("./modules/analytics/analytic_routes"));
const supervisor_routes_1 = __importDefault(require("./modules/supervisor/supervisor_routes"));
const Adminaccountantrouter_1 = __importDefault(require("./modules/AdminAccountant/Adminaccountantrouter"));
const s3_1 = __importDefault(require("./routes/s3"));
const review_routes_1 = __importDefault(require("./modules/feedback/review_routes"));
const floorRoutes_1 = __importDefault(require("./modules/floors/floorRoutes"));
const penalties_routes_1 = __importDefault(require("./modules/penalties/penalties_routes"));
const user_Routes_1 = __importDefault(require("./modules/users/user_Routes"));
const fraud_routes_1 = __importDefault(require("./modules/fraud/fraud_routes"));
const notification_routes_1 = __importDefault(require("./modules/notifications/notification_routes"));
const system_routes_1 = __importDefault(require("./modules/system/system_routes"));
const maintenance_1 = require("./middlewares/maintenance");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((req, _res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin)
            return callback(null, true);
        // In production, you might want to restrict this to your actual domain
        // For now, allowing all while we transition to a reverse proxy setup
        callback(null, true);
    },
    credentials: true,
}));
// Register maintenance middleware early
app.use(maintenance_1.maintenanceMiddleware);
const PORT = Number(process.env.PORT) || 3033;
(0, connectDatabase_1.connectDatabase)();
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
app.get('/health', async (_req, res) => {
    logger_1.logger.info('Health check requested');
    const dbConnected = (0, connectDatabase_1.isDatabaseConnected)();
    const healthData = {
        status: dbConnected ? 'ok' : 'degraded',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        services: {
            database: { status: dbConnected ? 'connected' : 'disconnected' },
        },
        resources: {
            memory: {
                total: (os_1.default.totalmem() / 1024 / 1024 / 1024).toFixed(2) + ' GB',
                free: (os_1.default.freemem() / 1024 / 1024 / 1024).toFixed(2) + ' GB',
                usage: ((1 - os_1.default.freemem() / os_1.default.totalmem()) * 100).toFixed(2) + '%',
            },
            cpu: {
                load: os_1.default.loadavg()[0].toFixed(2),
            },
        },
    };
    res.status(healthData.status === 'ok' ? 200 : 503).json(healthData);
});
app.get('/test', (_req, res) => {
    res.json({ message: 'Backend reachable' });
});
app.get('/api/debug-test', (_req, res) => {
    res.json({ message: 'API Proxy working perfectly' });
});
// ─── Routes ───────────────────────────────────────────────────────────────────
// IMPORTANT: More specific routes must come BEFORE generic catch-all mounts
app.use('/api/analytics', analytic_routes_1.default);
app.use('/api/admin/system', system_routes_1.default);
app.use('/api/auth', auth_routes_1.default);
app.use('/api/vehicle', vechicleRoutes_1.default);
app.use('/api/buildings', buildings_routes_1.default);
app.use('/api/users', user_Routes_1.default);
app.use('/api/supervisor', supervisor_routes_1.default);
app.use('/api/salary', salary_routes_1.default);
app.use('/api/incentives', incentives_routes_1.default);
app.use('/api/floors', floorRoutes_1.default);
app.use('/api/notifications', notification_routes_1.default);
app.use('/api', Adminaccountantrouter_1.default);
app.use('/api', attendance_routes_1.default);
app.use('/s3', s3_1.default);
app.use('/workers', workers_routes_1.default);
app.use('/tasks', tasks_routes_1.default);
app.use('/penalties', penalties_routes_1.default);
app.use('/feedback', review_routes_1.default);
app.use('/fraud', fraud_routes_1.default);
// Catch-all for unmatched routes
app.use((req, res, _next) => {
    console.log(`[404 NOT MATCHED] ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found`,
    });
});
app.use(error_handler_1.globalErrorHandler);
app.listen(PORT, '0.0.0.0', () => {
    console.log('Backend running on port 3033');
});
