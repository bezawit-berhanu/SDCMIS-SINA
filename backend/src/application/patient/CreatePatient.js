class CreatePatient {
    constructor({ patientRepository, branchRepository }) {
        this.patientRepository = patientRepository;
        this.branchRepository = branchRepository;
    }

    async execute({
        name,
        age,
        contact,
        service,
        serviceType,
        initialProcedure,
        initialProcedureName,
        procedureName,
        initialFee,
        dentistId,
        dentistName,
        branchId,
        createdByUserId = "system",
    }) {
        const errors = {};

        const patientName = (name || "").trim();
        if (!patientName) {
            errors.name = "Patient name is required.";
        } else if (patientName.length > 120) {
            errors.name = "Patient name must not exceed 120 characters.";
        }

        const parsedAge = age !== undefined && age !== null && age !== "" ? Number(age) : NaN;
        if (Number.isNaN(parsedAge)) {
            errors.age = "Patient age is required.";
        } else if (parsedAge < 0 || parsedAge > 150) {
            errors.age = "Patient age must be between 0 and 150.";
        }

        const patientContact = (contact || "").trim();
        if (!patientContact) {
            errors.contact = "Contact information is required.";
        } else if (patientContact.length < 3 || patientContact.length > 255) {
            errors.contact = "Contact information must be between 3 and 255 characters.";
        }

        const fee = initialFee !== undefined && initialFee !== null && initialFee !== "" ? Number(initialFee) : 0;
        if (Number.isNaN(fee) || fee < 0) {
            errors.initialFee = "Initial fee must be a valid non-negative number.";
        }

        // Branch verification (Task 10)
        let resolvedBranchId = branchId || null;
        if (resolvedBranchId && this.branchRepository) {
            const branch = await this.branchRepository.findById(resolvedBranchId);
            if (!branch) {
                errors.branchId = "Selected branch does not exist.";
            }
        }

        // Dentist verification (Task 10)
        let resolvedDentistId = dentistId || null;
        if (resolvedDentistId && this.branchRepository) {
            const dentist = await this.branchRepository.findDentistById(resolvedDentistId);
            if (!dentist) {
                errors.dentistId = "Selected dentist does not exist.";
            } else if (resolvedBranchId && dentist.branchId && dentist.branchId !== resolvedBranchId) {
                // Associate dentist with branch or allow cross-branch assignment
                await this.branchRepository.associateDentistWithBranch(resolvedDentistId, resolvedBranchId);
            }
        }

        if (Object.keys(errors).length > 0) {
            const err = new Error("Validation failed for patient registration.");
            err.statusCode = 400;
            err.code = "VALIDATION_ERROR";
            err.fields = errors;
            throw err;
        }

        const createdPatient = await this.patientRepository.create({
            name: patientName,
            age: Math.floor(parsedAge),
            contact: patientContact,
            service: (service || serviceType || "").trim(),
            serviceType: (service || serviceType || "").trim(),
            initialProcedure: (initialProcedure || procedureName || initialProcedureName || "").trim(),
            initialProcedureName: (initialProcedureName || procedureName || (initialProcedure ? initialProcedure.trim().slice(0, 120) : "")).trim(),
            initialFee: fee,
            dentistId: resolvedDentistId,
            branchId: resolvedBranchId,
            createdByUserId,
        }, createdByUserId);

        return {
            patient: createdPatient.toSafeObject(),
            message: "Patient registered successfully.",
        };
    }
}

module.exports = CreatePatient;
