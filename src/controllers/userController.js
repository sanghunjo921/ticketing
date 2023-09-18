import { Ticket, User } from "../models/Ticket";

export const userController = {
  getAllUsers: async (req, res) => {
    const users = User.findAll();
    res.json({
      message: "Get all users",
      data: {
        users,
      },
    });
  },

  getUserById: async (req, res) => {
    const targetUser = await User.findByPk(req.params.id);
    res.json({
      message: "Get one user info",
      data: {
        targetUser,
      },
    });
  },

  buyTicketById: async (req, res) => {
    const targetUser = await User.findByPk(req.params.id, {
      include: [
        {
          model: Ticket,
          through: { attributes: [] },
        },
      ],
    });
    console.log(targetUser);
    targetUser.tickets.find((e) => e.id === req.params.ticketId); /// 원하는 티켓 오브젝트

    //     const foo = Foo.findByPk(id)
    // console.log(foo.getBars({ joinTableAttributes: [] }))
  },
};
