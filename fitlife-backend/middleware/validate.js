module.exports = (schema) => async (req, res, next) => {
  try {
    await schema.validate(req.body, { abortEarly: false });
    next();
  } catch (err) {
    return res.status(400).json({
      errors: err.inner.reduce((acc, curr) => {
        acc[curr.path] = curr.message;
        return acc;
      }, {})
    });
  }
};
