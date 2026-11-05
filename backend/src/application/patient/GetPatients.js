class GetPatients {
    constructor({ patientRepository }) {
        this.patientRepository = patientRepository;
    }

    async execute(query = {}) {
        const search = (query.search || query.q || query.name || "").trim();
        const service = (query.service || query.serviceType || query.service_type || "").trim();
        const status = (query.status || "").trim();
        const outstandingBalance = (query.outstandingBalance || query.balance || "").trim();
        const procedureState = (query.procedureState || query.procedure_state || "").trim();
        const branchId = (query.branchId || query.branch_id || "").trim();
        const dentistId = (query.dentistId || query.dentist_id || "").trim();

        const patients = await this.patientRepository.findAll({
            search,
            service,
            status,
            outstandingBalance,
            procedureState,
            branchId,
            dentistId,
        });

        const safeList = patients.map((p) => (typeof p.toSafeObject === "function" ? p.toSafeObject() : p));

        return {
            patients: safeList,
            data: safeList,
            total: safeList.length,
            filtersApplied: {
                search: search || null,
                service: service || null,
                status: status || null,
                outstandingBalance: outstandingBalance || null,
                procedureState: procedureState || null,
                branchId: branchId || null,
                dentistId: dentistId || null,
            },
        };
    }
}

module.exports = GetPatients;
