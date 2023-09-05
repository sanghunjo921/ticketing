export const ticketController = {
  getAllTickets: (req, res) => {
    res.json({
      message: "Get all tickets",
    });
  },
  getTicketsById: (req, res) => {
    res.json({
      message: "Get one tickets",
    });
  },
};
