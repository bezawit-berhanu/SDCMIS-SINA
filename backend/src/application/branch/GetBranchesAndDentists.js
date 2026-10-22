class GetBranchesAndDentists {
    constructor({ branchRepository }) {
        this.branchRepository = branchRepository;
    }

    async execute() {
        const branches = await this.branchRepository.findAllActive();
        const dentists = await this.branchRepository.findAllDentists();

        // Ensure dentists have branch metadata
        const enrichedDentists = dentists.map((d) => {
            const branch = branches.find((b) => b.id === d.branchId);
            return {
                ...d,
                branchName: branch ? branch.name : "Unassigned",
            };
        });

        return {
            branches: branches.map((b) => b.toSafeObject()),
            dentists: enrichedDentists,
        };
    }
}

module.exports = GetBranchesAndDentists;
