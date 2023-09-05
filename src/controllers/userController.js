export const userController = {
  getAllUsers: (req, res) => {
    res.json({
      message: "Get all users",
    });
  },
  getUserById: (req, res) => {
    res.json({
      message: "Get one user info",
    });
  },
};
