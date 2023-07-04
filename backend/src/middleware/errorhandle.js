const errorhandle = (err, req, res, next) => {
    res.status(500).send({
        message: err.message
    })
}

module.exports = errorhandle