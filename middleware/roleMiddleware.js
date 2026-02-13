module.exports = function (req, res, next) {
    if (req.user && req.user.username) {
        if (req.user.username === process.env.ADMIN_USER_NAME) {
            next();
        } else {
            return res.status(403).json({ message: 'Access denied. Master admin role required.' });
        }
    } else {
        return res.status(401).json({ message: 'Not authenticated or user information missing.' });
    }
};