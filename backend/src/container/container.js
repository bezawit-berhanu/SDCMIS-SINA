const prisma = require("../Infrastructure/prisma");
const userRepository = require("../Infrastructure/Repositories/user.repository");

const passwordService = require("../Infrastructure/authentication/password.service");
const tokenService = require("../Infrastructure/authentication/token.service");

const LoginUser = require("../application/auth/LoginUser");
const RegisterUser = require("../application/auth/RegisterUser");
const GetCurrentUser = require("../application/auth/GetCurrentUser");

const UpdateUserName = require("../application/settings/UpdateUserName");
const UpdateUserContact = require("../application/settings/UpdateUserContact");
const ChangeUserPassword = require("../application/settings/ChangeUserPassword");
const UpdateUserProfile = require("../application/settings/UpdateUserProfile");

const patientRepository = require("../Infrastructure/Repositories/patient.repository");
const branchRepository = require("../Infrastructure/Repositories/branch.repository");

const CreatePatient = require("../application/patient/CreatePatient");
const GetPatients = require("../application/patient/GetPatients");
const GetPatientById = require("../application/patient/GetPatientById");
const UpdatePatient = require("../application/patient/UpdatePatient");
const DeletePatient = require("../application/patient/DeletePatient");
const GetBranchesAndDentists = require("../application/branch/GetBranchesAndDentists");

const loginUser = new LoginUser({
    userRepository,
    passwordService,
    tokenService,
});

const registerUser = new RegisterUser({
    userRepository,
    passwordService,
});

const getCurrentUser = new GetCurrentUser({
    userRepository,
});

const updateUserName = new UpdateUserName({
    userRepository,
});

const updateUserContact = new UpdateUserContact({
    userRepository,
});

const changeUserPassword = new ChangeUserPassword({
    userRepository,
    passwordService,
});

const updateUserProfile = new UpdateUserProfile({
    userRepository,
});

const createPatient = new CreatePatient({
    patientRepository,
    branchRepository,
});

const getPatients = new GetPatients({
    patientRepository,
});

const getPatientById = new GetPatientById({
    patientRepository,
});

const updatePatient = new UpdatePatient({
    patientRepository,
    branchRepository,
});

const deletePatient = new DeletePatient({
    patientRepository,
});

const getBranchesAndDentists = new GetBranchesAndDentists({
    branchRepository,
});

const ProcedureRepository = require("../Infrastructure/Repositories/procedure.repository");
const PaymentRepository = require("../Infrastructure/Repositories/payment.repository");

const CreateNextProcedure = require("../application/procedure/CreateNextProcedure");
const GetProceduresByPatient = require("../application/procedure/GetProceduresByPatient");
const UpdateProcedure = require("../application/procedure/UpdateProcedure");
const DeleteProcedure = require("../application/procedure/DeleteProcedure");
const StartOngoingProcedure = require("../application/procedure/StartOngoingProcedure");
const CompleteProcedure = require("../application/procedure/CompleteProcedure");

const RecordPayment = require("../application/payment/RecordPayment");
const GetPaymentHistory = require("../application/payment/GetPaymentHistory");

const AppointmentRepository = require("../Infrastructure/Repositories/appointment.repository");

const CreateAppointment = require("../application/appointment/CreateAppointment");
const GetAppointments = require("../application/appointment/GetAppointments");
const GetAppointmentById = require("../application/appointment/GetAppointmentById");
const UpdateAppointment = require("../application/appointment/UpdateAppointment");
const DeleteAppointment = require("../application/appointment/DeleteAppointment");
const CancelAppointment = require("../application/appointment/CancelAppointment");
const RescheduleAppointment = require("../application/appointment/RescheduleAppointment");
const DetectAndSyncMissedAppointments = require("../application/appointment/DetectAndSyncMissedAppointments");

const procedureRepository = new ProcedureRepository(prisma, patientRepository);
const paymentRepository = new PaymentRepository(prisma, patientRepository);
const appointmentRepository = new AppointmentRepository({ prisma, patientRepository, procedureRepository });

const createNextProcedure = new CreateNextProcedure(procedureRepository, patientRepository);
const getProceduresByPatient = new GetProceduresByPatient(procedureRepository, patientRepository);
const updateProcedure = new UpdateProcedure(procedureRepository, patientRepository);
const deleteProcedure = new DeleteProcedure(procedureRepository, patientRepository);
const startOngoingProcedure = new StartOngoingProcedure(procedureRepository, patientRepository);
const completeProcedure = new CompleteProcedure(procedureRepository, patientRepository);

const recordPayment = new RecordPayment(paymentRepository, patientRepository);
const getPaymentHistory = new GetPaymentHistory(paymentRepository, patientRepository, procedureRepository);

const createAppointment = new CreateAppointment({ appointmentRepository, patientRepository, procedureRepository });
const getAppointments = new GetAppointments({ appointmentRepository });
const getAppointmentById = new GetAppointmentById({ appointmentRepository });
const updateAppointment = new UpdateAppointment({ appointmentRepository, procedureRepository });
const deleteAppointment = new DeleteAppointment({ appointmentRepository });
const cancelAppointment = new CancelAppointment({ appointmentRepository });
const rescheduleAppointment = new RescheduleAppointment({ appointmentRepository, patientRepository });
const detectAndSyncMissedAppointments = new DetectAndSyncMissedAppointments({ appointmentRepository });

const QueueRepository = require("../Infrastructure/Repositories/queue.repository");
const NotificationRepository = require("../Infrastructure/Repositories/notification.repository");
const { realtimeGateway } = require("../Infrastructure/realtime/realtime.gateway");

const CheckInPatient = require("../application/queue/CheckInPatient");
const GetLiveQueue = require("../application/queue/GetLiveQueue");
const CallCustomer = require("../application/queue/CallCustomer");
const AutoAdvanceQueue = require("../application/queue/AutoAdvanceQueue");
const CompleteVisit = require("../application/queue/CompleteVisit");
const GetNotifications = require("../application/notification/GetNotifications");
const MarkNotificationRead = require("../application/notification/MarkNotificationRead");
const GetUnreadNotifications = require("../application/notification/GetUnreadNotifications");
const MarkAllNotificationsRead = require("../application/notification/MarkAllNotificationsRead");

const queueRepository = new QueueRepository({ prisma, patientRepository });
const notificationRepository = new NotificationRepository({ prisma });

const checkInPatient = new CheckInPatient({ queueRepository, patientRepository, realtimeGateway });
const getLiveQueue = new GetLiveQueue({ queueRepository });
const callCustomer = new CallCustomer({ queueRepository, notificationRepository, patientRepository, userRepository, realtimeGateway });
const autoAdvanceQueue = new AutoAdvanceQueue({ queueRepository, callCustomer, realtimeGateway });
const completeVisit = new CompleteVisit({ queueRepository, autoAdvanceQueue, realtimeGateway });
const getNotifications = new GetNotifications({ notificationRepository });
const markNotificationRead = new MarkNotificationRead({ notificationRepository });
const getUnreadNotifications = new GetUnreadNotifications({ notificationRepository });
const markAllNotificationsRead = new MarkAllNotificationsRead({ notificationRepository });

const GetCustomerDashboard = require("../application/patient/GetCustomerDashboard");
const GetCustomerQueuePosition = require("../application/queue/GetCustomerQueuePosition");
const GetDentistDashboard = require("../application/dashboard/GetDentistDashboard");
const GetReceptionistDashboard = require("../application/dashboard/GetReceptionistDashboard");

const getDentistDashboard = new GetDentistDashboard({
    patientRepository,
    procedureRepository,
    paymentRepository,
});

const getReceptionistDashboard = new GetReceptionistDashboard({
    appointmentRepository,
    queueRepository,
});

const getCustomerDashboard = new GetCustomerDashboard({
    patientRepository,
    queueRepository,
    procedureRepository,
    paymentRepository,
    appointmentRepository,
});

const getCustomerQueuePosition = new GetCustomerQueuePosition({ queueRepository });

const container = {
    prisma,
    userRepository,
    patientRepository,
    branchRepository,
    procedureRepository,
    paymentRepository,
    appointmentRepository,
    queueRepository,
    notificationRepository,
    realtimeGateway,
    passwordService,
    tokenService,
    loginUser,
    registerUser,
    getCurrentUser,
    updateUserName,
    updateUserContact,
    changeUserPassword,
    updateUserProfile,
    createPatient,
    getPatients,
    getPatientById,
    updatePatient,
    deletePatient,
    getBranchesAndDentists,
    createNextProcedure,
    getProceduresByPatient,
    updateProcedure,
    deleteProcedure,
    startOngoingProcedure,
    completeProcedure,
    recordPayment,
    getPaymentHistory,
    createAppointment,
    getAppointments,
    getAppointmentById,
    updateAppointment,
    deleteAppointment,
    cancelAppointment,
    rescheduleAppointment,
    detectAndSyncMissedAppointments,
    checkInPatient,
    getLiveQueue,
    callCustomer,
    autoAdvanceQueue,
    completeVisit,
    getNotifications,
    markNotificationRead,
    getUnreadNotifications,
    markAllNotificationsRead,
    getCustomerDashboard,
    getCustomerQueuePosition,
    getDentistDashboard,
    getReceptionistDashboard,
};

module.exports = container;