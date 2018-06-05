var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var pool = mysql.createPool({
   connectionLimit: 5,
   host: 'eonse.iptime.org',
   user: 'user',
   database: 'project',
   password: '1234123409Eon'
});
/* GET home page. */
router.get('/', function(req, res, next) {

  pool.getConnection(function(err,connection){
    var sqlinsert="SELECT item_idx,item_name,item_price,item_category,item_image from item_table";
    connection.query(sqlinsert,function(err,rows){
      if(err) console.error("err: "+err);
      console.log("rows : " + JSON.stringify(rows));
      res.render('index', { title: 'Express',rows:rows, session:req.session.mem_idx });
      connection.release();
    })
  })

});
router.get('/login', function(req, res, next) {
  res.render('login', { title: 'login' });
});
router.get('/join', function(req, res, next) {
  res.render('join', { title: 'join' });
});
router.get('/cart', function(req, res, next) {
  if(!req.session.mem_idx) res.redirect('/login');
  else {
    var mem_idx=req.session.mem_idx;
    var sqlUserCart = "SELECT item_name,item_category,item_price,item_image FROM cart_table WHERE user_idx = ? AND item_buy=0";
    pool.getConnection(function(err,connection){
      connection.query(sqlUserCart,mem_idx,function(err,rows){
        if(err) console.error("cart db err : "+ err);
        else{
          console.log("cart db success : "+ JSON.stringify(rows));
          res.render('cart',{title:'cart', rows:rows});
          connection.release();
        }
      });
    });
  }

});
router.get('/shop', function(req, res, next) {
  res.render('shop', { title: 'shop' });
});


router.get('/admin', function(req, res, next) {
  res.render('admin', { title: 'admin' });
});
router.post('/join',function(req,res,next){
  var user_id=req.body.user_id;
  var user_pw=req.body.user_pw;
  var user_name=req.body.user_name;
  var user_address=req.body.user_address;
  var user_email=req.body.user_email;
  var datas=[user_id,user_pw,user_name,'0',user_address,user_email];

  pool.getConnection(function (err,connection)
{
  if(err) console.error("err : " + err);
  var sqlForInsertBoard = "insert into user_table(user_id,user_pw,user_name,admin_user,user_address,user_email) values(?,?,?,?,?,?)";
  var confirm_id = "select user_id from user_table where user_id = ?";
  connection.query(confirm_id,user_id,function(err,rows){
    if(err) console.error("err : " + err);
    else if(rows.length>0)
    {
      res.send("<script>alert('이미존재하는 ID입니다');history.back();</script>");
    }
    else{
        connection.query(sqlForInsertBoard,datas,function(err,rows){
        if(err) console.error("err : " + err);
        console.log("rows: " + JSON.stringify(rows));
        res.send("<script>alert('회원가입 성공!');location.href='/login';</script>");
        connection.release();
  });}
});
});
});
router.post('/product_detail/:name',function(req,res,next){
  var user_idx=0;
  if(req.session.mem_idx)user_idx=req.session.mem_idx;
  //var user_idx=req.session.mem_idx;
  var item_name=req.body.name;
  var item_price=req.body.price;
  var item_category=req.body.category;
  var item_image=req.body.image;
  //console.log(req.session.mem_idx);
  console.log(req.body.name);
  //console.log(req.body.price);
  var datas=[user_idx,'0',item_name,item_category,item_price,item_image,'0'];

  pool.getConnection(function (err,connection)
{
  if(err) console.error("err : " + err);
  var sqlForInsertBoard = "insert into cart_table(user_idx,user_stock,item_name,item_category,item_price,item_image,item_buy,item_date) values(?,?,?,?,?,?,?,now())";
  connection.query(sqlForInsertBoard,datas,function(err,rows){
    if(err) console.error("err : " + err);
    console.log("rows!!!!: " + JSON.stringify(rows));
    res.send("<script>alert('장바구니 성공!');location.href='/';</script>");
    connection.release();
});
});});
router.get('/', function(req, res, next) {
  if(req.session.mem_idx){
    console.log("session.mem_idx : "+req.session.mem_idx);
    res.render('logout',{title: 'logout'});
  }
  res.render('index', { title: 'Express' });
});

router.post('/login',function(req,res,next){
  var user_id = req.body.user_id;
  var user_pw = req.body.user_pw;
  var datas = [user_id,user_pw];

  console.log("id : "+ user_id);
  console.log("pw : "+ user_pw);

  pool.getConnection(function (err,connection){
    var sqlForCheckMemInfo = "SELECT idx FROM user_table WHERE user_id=? AND user_pw=?";
  connection.query(sqlForCheckMemInfo,datas,function(err,rows){
    if(err) { console.error("err in check : " + err); throw err; }
    //console.log("rows : "+JSON.stringify(rows) + rows.length);
    if(rows && rows.length>0){
      //console.log("mem_idx: "+ rows[0].mem_idx);
      req.session.mem_idx=rows[0].idx;
      console.log("session.idx : "+req.session.mem_idx);
      res.send("<script>alert('로그인 성공!');location.href='/';</script>");
    }
    else {
      res.send("<script>alert('로그인 정보가 일치하지 않습니다.');history.back();</script>");
    }
  });
});
});
router.get('/admin', function(req, res, next) {
  res.render('admin', { title: 'Express' });
});

router.get('/product_detail/:name', function(req, res, next) {
  var user_idx = req.session.mem_idx;
  //var item_name = req.param('name');
  var item_name = req.params.name;
  console.log("Test Success : " + item_name);

  pool.getConnection(function(err,connection){
    var sqlProductDetail="SELECT item_name,item_price,item_stock,item_category,item_image,item_detail_image from item_table WHERE item_name=?";
    connection.query(sqlProductDetail,item_name,function(err,rows){
      if(err) console.error("err: "+err);
      else{
      console.log("rows : " + JSON.stringify(rows));

        var sqlRecommendItem = "SELECT item_name,item_price,item_stock,item_category,item_image from item_table WHERE item_category=? AND item_name!=?"
        connection.query(sqlRecommendItem,[rows[0].item_category,rows[0].item_name],function(err,rows2){
          if(err) console.error("recomment item error : "+err);
          else{
          console.log("\n\ndetail rows2 :: "+JSON.stringify(rows2));
          console.log(rows[0].item_name);
          var sqlReview = "SELECT user_name, item_review, item_grade FROM review_table WHERE item_name=?";
          connection.query(sqlReview,rows[0].item_name,function(err,rows3){
            if(err) console.error("review error : "+error);
            else{
              console.log("\n\ndetail row3 :: "+JSON.stringify(rows3));
              res.render('product_detail', { title: 'product_detail',session:req.session.mem_idx,rows:rows, rows2:rows2,rows3:rows3 });
              connection.release();
            }
          });
          }
        });
      }
    })
  })
});

router.get('/logout',function(req,res,next){
  console.log('logout success');
  req.session.destroy();
  res.redirect('/');
});

router.get('/cart_delete/:name',function(req,res,next){
  console.log('\nGET : cart_delete\n');
  var item_name = req.params.name;

  pool.getConnection(function(err,connection){
    var sqlCartDelete = "DELETE FROM cart_table WHERE item_name=?"

    connection.query(sqlCartDelete,item_name,function(err,rows){
      if(err) console.error("cart delete err : "+err);
      else{
        res.redirect('/cart');
        connection.release();
      }
    })
  });
});
router.get('/buy',function(req,res,next){
  console.log("GET buy success");

  pool.getConnection(function(err,connection){
    var sqlBuy = "UPDATE cart_table set item_buy=1, item_date=now() where item_buy=0 AND user_idx=?"
    connection.query(sqlBuy,req.session.mem_idx,function(err,rows){
      if(err) console.error("cart update err : "+err);
      else{
        res.redirect('/buy_history');
        connection.release();
      }
    });
  });
});
router.get('/buy_history', function(req, res, next) {

  if(!req.session.mem_idx) res.redirect('/login');
  else {
    var mem_idx=req.session.mem_idx;
    var sqlBuyHistory = "SELECT item_name,item_category,item_price,item_image,user_stock FROM cart_table WHERE user_idx = ? AND item_buy=1";
    pool.getConnection(function(err,connection){
      connection.query(sqlBuyHistory,mem_idx,function(err,rows){
        if(err) console.error("buyHistory db err : "+ err);
        else{
          console.log("buyhistory success ");
          res.render('buy_history',{title:'buy_history', rows:rows});
          connection.release();
        }
      });
    });
  }
});

router.post('/user_stock_update',function(req,res,next){
  pool.getConnection(function(err,connection){
    var sqlBuyUpdate = "UPDATE cart_table set user_stock=? where item_name=? AND item_buy=0 AND user_idx=?"
    var datas = [req.body.stock,req.body.name,req.session.mem_idx];
    connection.query(sqlBuyUpdate,datas,function(err,rows){
      if(err) console.error("userstockupdate db err : "+ err);
        else{
          console.log("userstockupdate success ");
          res.redirect('/cart');
          connection.release();
        }
    });
  })
});
router.get('/review',function(req,res,next){
  var datas =[req.query.user_name, req.query.item_name, req.query.item_review, req.query.item_grade];
  console.log(datas);
  pool.getConnection(function(err,connection){
    var sqlAddReview="INSERT into review_table(user_name,item_name,item_review,item_grade) values(?,?,?,?)";
    connection.query(sqlAddReview,datas,function(err,rows){
      if(err) console.error("review error : "+err);
      else{
        //console.log("review ADD success");
        res.redirect('/product_detail/'+req.query.item_name);
        connection.release();
      }
    });
  })
  });
module.exports = router;
