const container = require("../../container/container");

const branchController = {
    async getBranches(req, res, next) {
        try {
            const result = await container.getBranchesAndDentists.execute();
            return res.status(200).json({
                success: true,
                data: result.branches,
                dentists: result.dentists,
            });
        } catch (error) {
            next(error);
        }
    },

    async getDentists(req, res, next) {
        try {
            const result = await container.getBranchesAndDentists.execute();
            return res.status(200).json({
                success: true,
                data: result.dentists,
            });
        } catch (error) {
            next(error);
        }
    },
};

module.exports = branchController;
