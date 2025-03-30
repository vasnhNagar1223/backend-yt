const asyncHandler = (reqestHandler) => {
  (req, res, next) => {
    Promise.resolve(reqestHandler()).catch((err) => next(err));
  };
};

export {asyncHandler};

// const asynchandler ()=>{}
// const asynchandler ()=>{ () => {} }
// const asynchandler ()=> async () => {}

// const handler = (fn) => async (req, res, next) => {
//   try {
//     await fn(req, res, next);
//   } catch (err) {
//     res.status(err.code || 500).json({
//       succes: false,
//       message: err.message,
//     });
//   }
// };
