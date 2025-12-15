import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	return json({
		status: 'online',
		timestamp: new Date().toISOString(),
		uptime: '99.9%'
	});
};
