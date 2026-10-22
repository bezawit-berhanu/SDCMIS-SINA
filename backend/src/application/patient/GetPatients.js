class GetPatients {
    constructor({ patientRepository }) {
        this.patientRepository = patientRepository;
    }

    async execute(query = {}) {
        const {
            search = "",
            service = "",
            status = "",
            outstandingBalance = "",
            procedureState = "",
            branchId = "",
            dentistId = "",
        } = query;

        const patients = await this.patientRepository.findAll({
            search,
            service,
            status,
            outstandingBalance,
            procedureState,
            branchId,
            dentistId,
        });

        return {
            patients: patients.map((p) => p.toSafeObject()),
            total: patients.length,
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
