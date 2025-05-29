import jwt from 'jsonwebtoken';
export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split("Bearer ")[1];
  if (!token) {
    res.status(401).json({
      message: "Authorization token missing"
    });
    return;
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_AUTH_KEY);
    req.body.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({
      message: "Invalid token"
    });
  }
};