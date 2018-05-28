var express = require('express');
var router = express.Router();

//MySQL load
var mysql = require('mysql');
var pool = mysql.createPool({
  connectionLimit: 5,
  host: 'eonse.iptime.org',
  user: 'user',
  database: 'board',
  password: '1234123409Eon'
});

/* GET users listing. */
router.get('/', function(req,res,next) {

  res.render('admin', { title: 'Admin Login!!' });


});

module.exports = router;
