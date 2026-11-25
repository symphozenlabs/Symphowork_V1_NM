import type { RequestHandler } from './$types';
import { errorResponse } from '$lib/errors';
import { offboardEmployee } from '@/modules/employees/offboarding';

export const POST: RequestHandler = async ({ params }) => {
  try {
    return Response.json({ success: true, ...await offboardEmployee(params.employeeId) });
  } catch (error) {
    return errorResponse(error);
  }
};
