# SDCIMP Backend API Endpoint Verification & Registry

All endpoints adhere to SRS v2.0 Section 8.5 with REST status codes, JSON payload format, and RBAC authorization guards.

| Module | Method | Path | Access | Implementation / Controller | Verified |
|---|---|---|---|---|---|
| **Auth** | POST | `/api/auth/signup`, `/api/auth/register` | Public | `authController.register` | Yes |
| **Auth** | POST | `/api/auth/login` | Public | `authController.login` | Yes |
| **Auth** | POST | `/api/auth/logout` | Authenticated | `authController.logout` | Yes |
| **User/Me** | GET | `/api/me`, `/api/users/me` | Authenticated | `userController.getProfile` | Yes |
| **User/Me** | PATCH | `/api/me`, `/api/users/profile` | Authenticated | `userController.updateProfile` | Yes |
| **User/Me** | PATCH | `/api/me/theme` | Authenticated | `userController.updateTheme` | Yes |
| **User/Me** | POST | `/api/me/password` | Authenticated | `userController.changePassword` | Yes |
| **Dentist** | GET | `/api/dentist/dashboard` | Dentist | `dashboardController.getDentistDashboard` | Yes |
| **Dentist** | GET | `/api/dentist/tasks` | Dentist | `dashboardController.getDentistTasks` | Yes |
| **Dentist** | GET | `/api/dentist/missed-appointments` | Dentist | `dashboardController.getDentistMissedAppointments` | Yes |
| **Dentist** | GET | `/api/patients` | Dentist, Receptionist | `patientController.getPatients` | Yes |
| **Dentist** | POST | `/api/patients` | Dentist | `patientController.createPatient` | Yes |
| **Dentist** | GET | `/api/patients/:id` | Dentist, Own Customer | `patientController.getPatientById` | Yes |
| **Dentist** | PATCH | `/api/patients/:id` | Dentist | `patientController.updatePatient` | Yes |
| **Dentist** | DELETE | `/api/patients/:id` | Dentist | `patientController.deletePatient` | Yes |
| **Procedures** | POST | `/api/patients/:patientId/procedures` | Dentist | `procedureController.createNextProcedure` | Yes |
| **Procedures** | PATCH | `/api/procedures/:id/start` | Dentist | `procedureController.startOngoing` | Yes |
| **Procedures** | PATCH | `/api/procedures/:id/complete` | Dentist | `procedureController.completeProcedure` | Yes |
| **Payments** | POST | `/api/patients/:patientId/payments` | Staff | `paymentController.recordPayment` | Yes |
| **Payments** | GET | `/api/patients/:patientId/payments` | Staff | `paymentController.getPaymentHistory` | Yes |
| **Appointments**| POST | `/api/appointments/:id/reschedule` | Dentist | `appointmentController.reschedule` | Yes |
| **Receptionist**| GET | `/api/receptionist/dashboard` | Staff | `dashboardController.getReceptionistDashboard` | Yes |
| **Receptionist**| GET | `/api/receptionist/customers` | Staff | `dashboardController.getReceptionistCustomers` | Yes |
| **Queue** | GET | `/api/queue/today`, `/api/queue` | Staff | `queueController.getQueue` | Yes |
| **Queue** | POST | `/api/queue` | Staff | `queueController.checkIn` | Yes |
| **Queue** | POST | `/api/queue/:id/call` | Staff | `queueController.callCustomer` | Yes |
| **Queue** | POST | `/api/queue/:id/complete` | Staff | `queueController.completeVisit` | Yes |
| **Customer** | GET | `/api/queue/mine`, `/api/queue/my-position` | Customer | `queueController.getMyQueuePosition` | Yes |
| **Customer** | GET | `/api/customers/dashboard` | Customer | `patientController.getCustomerDashboard` | Yes |
| **Notifications**| GET | `/api/notifications` | Dentist | `queueController.getNotifications` | Yes |
| **Notifications**| PATCH| `/api/notifications/:id/read` | Dentist | `queueController.markNotificationRead` | Yes |
