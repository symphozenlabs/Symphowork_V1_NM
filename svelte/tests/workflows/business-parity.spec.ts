import { test, expect } from '@playwright/test';

test('EditEmployeeDialog loads manager choices from rows property and excludes self', async ({ page }) => {
  let patchPayload: any = null;
  await page.route('**/api/**', async (r) => {
    const url = r.request().url();
    const method = r.request().method();

    if (url.includes('/api/app/employees?pageSize=100')) {
      await r.fulfill({
        json: {
          success: true,
          rows: [
            { id: 'employee-1', displayName: 'Ada Lovelace (Self)', employeeId: 'EMP0001' },
            { id: 'employee-2', displayName: 'Charles Babbage', employeeId: 'EMP0002' },
            { id: 'employee-3', displayName: 'Grace Hopper', employeeId: 'EMP0003' }
          ]
        }
      });
      return;
    }

    if (url.includes('/api/app/master-data/departments')) {
      await r.fulfill({
        json: {
          success: true,
          items: [{ id: 'dept-1', name: 'Engineering', code: 'ENG' }]
        }
      });
      return;
    }

    if (url.includes('/api/app/master-data/')) {
      await r.fulfill({ json: { success: true, items: [] } });
      return;
    }

    if (method === 'PATCH' && url.includes('/api/app/employees/employee-1')) {
      patchPayload = r.request().postDataJSON();
      await r.fulfill({ json: { success: true } });
      return;
    }

    await r.fulfill({ json: { success: true } });
  });

  await page.goto('/?view=edit-employee');
  await expect(page.getByRole('heading', { name: 'Edit Employee Profile' })).toBeVisible();

  // Confirm Personal details
  await expect(page.getByLabel('First Name *')).toHaveValue('Ada');
  await expect(page.getByLabel('Last Name *')).toHaveValue('Lovelace');

  await page.locator('#edit-employee-field-12').click();
  await expect(page.getByRole('option').filter({hasText:'Charles Babbage'})).toBeVisible();
  await expect(page.getByRole('option').filter({hasText:'Grace Hopper'})).toBeVisible();
  await expect(page.getByRole('option').filter({hasText:'Ada Lovelace (Self)'})).toHaveCount(0);
  await page.getByRole('option').filter({hasText:'Charles Babbage'}).click();

  // Change phone number
  const phoneInput = page.getByLabel('Phone Number');
  if (await phoneInput.count() > 0) {
    await phoneInput.fill('+15559876543');
  }

  // Submit the form
  await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Fixture saved');
  expect(patchPayload).not.toBeNull();
  expect(patchPayload.firstName).toBe('Ada');
  expect(patchPayload.lastName).toBe('Lovelace');
  expect(patchPayload.reportingManagerId).toBe('employee-2');
});

test('EditEmployeeDialog preserves entered values on server rejection', async ({ page }) => {
  await page.route('**/api/**', async (r) => {
    const url = r.request().url();
    const method = r.request().method();

    if (url.includes('/api/app/master-data/')) {
      await r.fulfill({ json: { success: true, items: [] } });
      return;
    }
    if (url.includes('/api/app/employees?pageSize=100')) {
      await r.fulfill({ json: { success: true, rows: [] } });
      return;
    }
    if (method === 'PATCH') {
      await r.fulfill({
        status: 422,
        json: { success: false, error: { message: 'Work email domain not authorized.' } }
      });
      return;
    }
    await r.fulfill({ json: { success: true } });
  });

  await page.goto('/?view=edit-employee');
  await page.getByLabel('First Name *').fill('Augusta');
  await page.getByRole('button', { name: 'Save Changes', exact: true }).click();

  await expect(page.getByRole('alert')).toContainText('Work email domain not authorized.');
  await expect(page.getByLabel('First Name *')).toHaveValue('Augusta');
});

test('AttendanceActions executes punch clock_in and handles API response', async ({ page }) => {
  let punchPayload: any = null;
  await page.route('**/api/**', async (r) => {
    const url = r.request().url();
    const method = r.request().method();

    if (method === 'POST' && url.includes('/api/app/attendance/punch')) {
      punchPayload = r.request().postDataJSON();
      await r.fulfill({
        json: {
          success: true,
          punch: { id: 'p-1', punchType: 'clock_in', punchedAt: new Date().toISOString() }
        }
      });
      return;
    }

    if (url.includes('/api/app/attendance')) {
      await r.fulfill({
        json: {
          records: [
            {
              id: 'rec-1',
              attendanceDate: '2026-10-20',
              status: 'PRESENT',
              netWorkMinutes: 120,
              lateMinutes: 0,
              earlyDepartureMinutes: 0
            }
          ],
          punches: [],
          hasShift: true,
          shift: {
            id: 'shift-1',
            name: 'Standard Day',
            code: 'STD',
            startTime: '09:00',
            endTime: '18:00',
            overnight: false,
            breakMinutes: 60,
            graceMinutes: 15
          },
          employee: { id: 'emp-1', displayName: 'Ada Lovelace', employeeId: 'EMP001', isSelf: true },
          timezone: 'UTC'
        }
      });
      return;
    }

    await r.fulfill({ json: { success: true } });
  });

  await page.goto('/?view=attendance');
  await expect(page.getByText('Standard Day', { exact: true })).toBeVisible();

  // Find Clock In button
  const clockInBtn = page.getByRole('button', { name: /Clock In/i });
  await expect(clockInBtn).toBeVisible();
  await clockInBtn.click();

  expect(punchPayload).toEqual({ type: 'clock_in' });
  await expect(page.getByText(/Punch recorded/i)).toBeVisible();
});

test('AttendanceActions reports server error when punch fails', async ({ page }) => {
  await page.route('**/api/**', async (r) => {
    const url = r.request().url();
    const method = r.request().method();

    if (method === 'POST' && url.includes('/api/app/attendance/punch')) {
      await r.fulfill({
        status: 400,
        json: { success: false, error: { message: 'Already clocked in for this shift.' } }
      });
      return;
    }

    if (url.includes('/api/app/attendance')) {
      await r.fulfill({
        json: {
          records: [],
          punches: [],
          hasShift: true,
          shift: { id: 's-1', name: 'General Shift', code: 'GEN', startTime: '09:00', endTime: '17:00' },
          employee: { id: 'emp-1', displayName: 'Ada', employeeId: 'E1', isSelf: true }
        }
      });
      return;
    }

    await r.fulfill({ json: { success: true } });
  });

  await page.goto('/?view=attendance');
  const clockInBtn = page.getByRole('button', { name: /Clock In/i });
  await clockInBtn.click();

  await expect(page.getByText('Already clocked in for this shift.')).toBeVisible();
});

test('DocumentCenter enforces scan status gating before allowing file open', async ({ page }) => {
  await page.route('**/api/**', async (r) => {
    const url = r.request().url();

    if (url.includes('/api/app/documents/types')) {
      await r.fulfill({
        json: {
          types: [{ id: 'type-id', name: 'Government ID' }]
        }
      });
      return;
    }

    if (url.includes('/api/app/documents')) {
      await r.fulfill({
        json: {
          success: true,
          documents: [
            {
              id: 'doc-pending',
              fileName: 'passport_scan.pdf',
              status: 'PENDING',
              lifecycleStatus: 'SUBMITTED',
              scanStatus: 'scanning'
            },
            {
              id: 'doc-clean',
              fileName: 'offer_letter.pdf',
              status: 'APPROVED',
              lifecycleStatus: 'VERIFIED',
              scanStatus: 'clean'
            }
          ]
        }
      });
      return;
    }

    await r.fulfill({ json: { success: true } });
  });

  await page.goto('/?view=documents');
  await expect(page.getByText('passport_scan.pdf')).toBeVisible();
  await expect(page.getByText('offer_letter.pdf')).toBeVisible();

  // The unscanned document has button disabled with "Unavailable until clean"
  const pendingBtn = page.getByRole('button', { name: 'Unavailable until clean' });
  await expect(pendingBtn).toBeVisible();
  await expect(pendingBtn).toBeDisabled();

  // The clean document has active "Open" button
  const cleanBtn = page.getByRole('button', { name: 'Open', exact: true });
  await expect(cleanBtn).toBeVisible();
  await expect(cleanBtn).toBeEnabled();
});

test('AtsDashboard renders recruitment requisitions and candidates metrics', async ({ page }) => {
  await page.route('**/api/**', async (r) => {
    const url = r.request().url();

    if (url.includes('/api/app/ats/requisitions')) {
      await r.fulfill({
        json: {
          success: true,
          requisitions: [
            {
              id: 'req-1',
              requisitionNumber: 'REQ-2026-001',
              title: 'Principal Systems Architect',
              status: 'OPEN',
              openings: 2,
              jobDescription: 'Lead distributed systems architecture.'
            }
          ]
        }
      });
      return;
    }

    if (url.includes('/api/app/ats/jobs')) {
      await r.fulfill({ json: { success: true, jobs: [] } });
      return;
    }

    if (url.includes('/api/app/ats/candidates')) {
      await r.fulfill({
        json: {
          success: true,
          candidates: [
            {
              id: 'cand-1',
              candidateNumber: 'CND-1001',
              fullName: 'Katherine Johnson',
              email: 'kjohnson@example.test',
              currentDesignation: 'Orbital Mechanics Lead',
              location: 'Langley, VA',
              status: 'NEW'
            }
          ]
        }
      });
      return;
    }

    if (url.includes('/api/app/ats/applications')) {
      await r.fulfill({ json: { success: true, applications: [] } });
      return;
    }

    if (url.includes('/api/app/ats/interviews')) {
      await r.fulfill({ json: { success: true, interviews: [] } });
      return;
    }

    if (url.includes('/api/app/ats/stages')) {
      await r.fulfill({
        json: {
          success: true,
          stages: [
            { id: 'stg-1', name: 'Screening' },
            { id: 'stg-2', name: 'Technical' }
          ]
        }
      });
      return;
    }

    if (url.includes('/api/app/employees')) {
      await r.fulfill({ json: { success: true, rows: [] } });
      return;
    }

    await r.fulfill({ json: { success: true } });
  });

  await page.goto('/?view=ats-dashboard');
  await expect(page.getByText('Principal Systems Architect')).toBeVisible();
  await expect(page.getByText('REQ-2026-001')).toBeVisible();
});
