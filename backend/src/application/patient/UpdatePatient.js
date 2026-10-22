class UpdatePatient {
    constructor({ patientRepository, branchRepository }) {
        this.patientRepository = patientRepository;
        this.branchRepository = branchRepository;
    }

    async execute({
        patientId,
        name,
        fullName,
        age,
        contact,
        contactInfo,
        service,
        serviceType,
        dentistId,
        dentistid,
        branchId,
        branchID,
        remainingFee,
        balance,
        status,
        recordStatus,
        actorUserId = "system",
    }) {
        if (!patientId || typeof patientId !== "string" || !patientId.trim()) {
            const error = new Error("Patient ID is required.");
            error.statusCode = 400;
            error.code = "VALIDATION_ERROR";
            throw error;
        }

        const existing = await this.patientRepository.findById(patientId.trim());
        if (!existing) {
            const error = new Error(`Patient with ID '${patientId}' was not found.`);
            error.statusCode = 404;
            error.code = "NOT_FOUND";
            throw error;
        }

        const errors = {};
        const updateData = {};

        // Name validation
        const resolvedName = name !== undefined ? name : fullName;
        if (resolvedName !== undefined) {
            const trimmedName = typeof resolvedName === "string" ? resolvedName.trim() : "";
            if (!trimmedName) {
                errors.name = "Patient name cannot be empty.";
            } else if (trimmedName.length > 120) {
                errors.name = "Patient name must not exceed 120 characters.";
            } else {
                updateData.name = trimmedName;
            }
        }

        // Age validation
        if (age !== undefined && age !== null && age !== "") {
            const parsedAge = Number(age);
            if (Number.isNaN(parsedAge) || parsedAge < 0 || parsedAge > 150) {
                errors.age = "Patient age must be a valid number between 0 and 150.";
            } else {
                updateData.age = Math.floor(parsedAge);
            }
        }

        // Contact validation
        const resolvedContact = contact !== undefined ? contact : contactInfo;
        if (resolvedContact !== undefined) {
            const trimmedContact = typeof resolvedContact === "string" ? resolvedContact.trim() : "";
            if (!trimmedContact) {
                errors.contact = "Contact information cannot be empty.";
            } else if (trimmedContact.length < 3 || trimmedContact.length > 255) {
                errors.contact = "Contact information must be between 3 and 255 characters.";
            } else {
                updateData.contact = trimmedContact;
            }
        }

        // Service validation
        const resolvedService = service !== undefined ? service : serviceType;
        if (resolvedService !== undefined) {
            updateData.service = typeof resolvedService === "string" ? resolvedService.trim() : "";
        }

        // Branch validation (Task 10)
        const resolvedBranchId = branchId !== undefined ? branchId : branchID;
        if (resolvedBranchId !== undefined) {
            if (resolvedBranchId && this.branchRepository) {
                const branch = await this.branchRepository.findById(resolvedBranchId);
                if (!branch) {
                    errors.branchId = "Selected branch does not exist.";
                } else {
                    updateData.branchId = resolvedBranchId;
                }
            } else {
                updateData.branchId = resolvedBranchId || null;
            }
        }

        // Dentist validation (Task 10)
        const resolvedDentistId = dentistId !== undefined ? dentistId : dentistid;
        if (resolvedDentistId !== undefined) {
            if (resolvedDentistId && this.branchRepository) {
                const dentist = await this.branchRepository.findDentistById(resolvedDentistId);
                if (!dentist) {
                    errors.dentistId = "Selected dentist does not exist.";
                } else {
                    updateData.dentistId = resolvedDentistId;
                    if (updateData.branchId && dentist.branchId && dentist.branchId !== updateData.branchId) {
                        await this.branchRepository.associateDentistWithBranch(resolvedDentistId, updateData.branchId);
                    }
                }
            } else {
                updateData.dentistId = resolvedDentistId || null;
            }
        }

        // Remaining fee / balance
        const resolvedFee = remainingFee !== undefined ? remainingFee : balance;
        if (resolvedFee !== undefined && resolvedFee !== null && resolvedFee !== "") {
            const parsedFee = Number(resolvedFee);
            if (Number.isNaN(parsedFee) || parsedFee < 0) {
                errors.remainingFee = "Remaining fee/balance cannot be negative.";
            } else {
                updateData.remainingFee = parsedFee;
            }
        }

        // Status
        const resolvedStatus = status !== undefined ? status : recordStatus;
        if (resolvedStatus !== undefined) {
            updateData.status = resolvedStatus;
        }

        if (Object.keys(errors).length > 0) {
            const err = new Error("Validation failed for patient update.");
            err.statusCode = 400;
            err.code = "VALIDATION_ERROR";
            err.fields = errors;
            throw err;
        }

        const updated = await this.patientRepository.update(patientId.trim(), updateData, actorUserId);

        return {
            patient: updated.toSafeObject(),
            message: "Patient updated successfully.",
        };
    }
}

module.exports = UpdatePatient;
