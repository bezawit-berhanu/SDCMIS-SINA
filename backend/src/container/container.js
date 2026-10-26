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

const procedureRepository = new ProcedureRepository(prisma, patientRepository);
const paymentRepository = new PaymentRepository(prisma, patientRepository);

const createNextProcedure = new CreateNextProcedure(procedureRepository, patientRepository);
const getProceduresByPatient = new GetProceduresByPatient(procedureRepository, patientRepository);
const updateProcedure = new UpdateProcedure(procedureRepository, patientRepository);
const deleteProcedure = new DeleteProcedure(procedureRepository, patientRepository);
const startOngoingProcedure = new StartOngoingProcedure(procedureRepository, patientRepository);
const completeProcedure = new CompleteProcedure(procedureRepository, patientRepository);

const recordPayment = new RecordPayment(paymentRepository, patientRepository);
const getPaymentHistory = new GetPaymentHistory(paymentRepository, patientRepository, procedureRepository);

const container = {
    prisma,
    userRepository,
    patientRepository,
    branchRepository,
    procedureRepository,
    paymentRepository,
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
};

module.exports = container;