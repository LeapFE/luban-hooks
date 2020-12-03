let Users = [
  {
    id: 1,
    name: "Tom",
  },
  {
    id: 2,
    name: "James",
  },
  {
    id: 3,
    name: "June",
  },
];

module.exports = (express) => {
  express.all("*", (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", req.get("Origin") || "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Requested-With");
    res.setHeader("Access-Control-Allow-Credentials", "true");

    next();
  });

  express.get("/api/users", (req, res) => {
    let filterUsers = Users;
    if (typeof req.query.name === "string") {
      filterUsers = Users.filter(
        (user) => user.name.toLowerCase() === req.query.name.toLowerCase(),
      );
    }
    res.send({
      code: 1,
      data: filterUsers,
      msg: "ok",
    });
    res.status(200);
  });

  express.post("/api/user/:name", (req, res) => {
    if (req.params.name) {
      Users = Users.concat({ id: Users[Users.length - 1].id + 1, name: req.params.name });
    }
    res.send({
      code: 1,
      data: true,
      msg: "ok",
    });
    res.status(200);
  });

  express.delete("/api/user/:id", (req, res) => {
    if (req.params.id) {
      Users = Users.filter((user) => user.id !== Number(req.params.id));
    }
    res.send({
      code: 1,
      data: true,
      msg: "ok",
    });
    res.status(200);
  });
};
