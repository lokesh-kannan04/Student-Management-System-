import express from "express";
import { dirname } from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import pg from "pg";
import "dotenv/config";

const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD } = process.env;
let isstudentlogin = false;
let isstafflogin = false
const db = new pg.Client({
  user: PGUSER,
  host: PGHOST,
  database: PGDATABASE,
  password: PGPASSWORD,
  port: 5432,
  ssl:{
    require:true
  }
});
db.connect();
let details = [];

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));


//Password Authentication
let x;
let y;
let z;

//student login
app.post("/submit",async (req, res)=>
{
    console.log(req.body);
    x=req.body.rollno;
    const response = await db.query("SELECT * from student_info WHERE student_id = $1 AND password= $2",[req.body.rollno,req.body.password])
    if(response.rowCount){
      details = response.rows[0];
      isstudentlogin = true;
      res.render(__dirname+"/view/studentinfo.ejs",{student:details})
    }else{
      res.render(__dirname +"/view/studentlogin.ejs",{wrongup: false});
    }
    }
  )
 //student login using get
  app.get("/submit", (req, res)=>
  {
    if(isstudentlogin)
      {
        res.render(__dirname+"/view/studentinfo.ejs",{student:details});
      }
      else{
        res.render(__dirname + "/view/studentlogin.ejs", {wrongup: true});      }
  })
  //staff login
  app.post("/staffinfo",async (req, res)=>
    {
      console.log(req.body);
      x=req.body.staffid;

      //console.log(x);
      const response = await db.query("SELECT * from staff_info WHERE staff_id = $1 AND password= $2",[req.body.staffid,req.body.password])
      if(response.rowCount){
        //console.log('hi');
        details = response.rows[0];
        isstafflogin = true;
        res.render(__dirname+"/view/staffinfo.ejs",{staff:details})
      }else{
        //console.log('hi');
        res.render(__dirname +"/view/stafflogin.ejs",{wrongup: false});
      }
      }
    )
  //render to staff info
    app.get("/staffinfo", (req, res)=>
      {
        if(isstafflogin)
          {
            res.render(__dirname+"/view/staffinfo.ejs",{staff:details});
          }
          else{
            res.render(__dirname + "/view/stafflogin.ejs", {wrongup: true});     
           }
      })
    //default page 
      app.get("/", (req, res) => {
    
        res.render(__dirname + "/view/homepage.ejs");
       
        
      });



  //render to student info
app.get("/stinfo",(req, res)=>
{
  res.render(__dirname + "/view/studentInfo.ejs",{student:details});
});
 //render to course info
app.get("/stcourse",async (req, res)=>
{
  //const response =await db.query("SELECT * from student_info WHERE student_id = $1 ",[x])
  const response2 = await db.query("SELECT ce.course_code,c.course_name,s.staff_name,d.dept_name,st.studentfname,st.studentlname,st.student_id from courses_enrolled ce join staff_info s on ce.staff_id=s.staff_id join course c on ce.course_code=c.course_code join department d on d.dept_no=c.dept_no join student_info st on st.student_id=ce.student_id WHERE ce.student_id=$1 AND ce.semester=4",[x])
      if(response2.rowCount){
        console.log(response2.rows);
        res.render(__dirname+"/view/studentcourse.ejs",{courses:response2})
        
}});
 //render to student attendance
app.get("/stattendance",(req,res)=>
{
  res.render(__dirname + "/view/studentattendance.ejs");
});
 //render to student marks page
app.get("/stmarks",async (req, res)=>
{
  let response2 = await db.query("SELECT a.first_half,a.second_half,a.total,ce.course_code,c.credits,c.course_name,st.studentfname,st.studentlname,st.student_id,m.assess1,m.assess2,m.attendance,m.midsem,m.endsem,m.grade,m.marksobtained from courses_enrolled ce join course c on ce.course_code=c.course_code join student_info st on st.student_id=ce.student_id join marks m on m.student_id=st.student_id and m.course_code=ce.course_code join attendance a on a.student_id=st.student_id and a.course_code=ce.course_code WHERE ce.student_id=$1 AND ce.semester=4",[x])
  const courseResult = await db.query("SELECT ce.course_code from courses_enrolled ce join course c on ce.course_code=c.course_code join student_info st on st.student_id=ce.student_id join marks m on m.student_id=st.student_id and m.course_code=ce.course_code WHERE ce.student_id=$1 AND ce.semester=4",[x])
  const courseCodes = courseResult.rows.map(row => row.course_code);
        const marksSecured = [];
        const grade=[];
        for (const courseCode of courseCodes) {
            const totalResult = await db.query(
                "SELECT FINDTOTAL($1, $2) AS total", [x, courseCode]
            );
            response2 = await db.query("SELECT a.first_half,a.second_half,a.total,ce.course_code,c.credits,c.course_name,st.studentfname,st.studentlname,st.student_id,m.assess1,m.assess2,m.attendance,m.midsem,m.endsem,m.grade,m.marksobtained from courses_enrolled ce join course c on ce.course_code=c.course_code join student_info st on st.student_id=ce.student_id join marks m on m.student_id=st.student_id and m.course_code=ce.course_code join attendance a on a.student_id=st.student_id and a.course_code=ce.course_code WHERE ce.student_id=$1 AND ce.course_code=$2 and ce.semester=4",[x,courseCode])
            const inserttotal = await db.query("update marks set marksobtained=$1 WHERE course_code=$2 and student_id=$3",[totalResult.rows[0].total,courseCode,x]);
            const findprocedure=await db.query("SELECT GRADECOMPUTE($1) AS gradeval",[totalResult.rows[0].total]);
            const insertgrade =await db.query("update marks set grade=$1 WHERE course_code=$2 and student_id=$3",[findprocedure.rows[0].gradeval,courseCode,x])
            let percentage=((response2.rows[0].first_half+response2.rows[0].second_half)/response2.rows[0].total)*100;
            //console.log(response2.rows[0].first_half);
            percentage=await db.query("update attendance set attendance_percentage=round($1,2) WHERE course_code=$2 and student_id=$3 ",[percentage,courseCode,x])
        }
       response2 = await db.query("SELECT a.attendance_percentage,a.first_half,a.second_half,a.total,c.credits,ce.course_code,c.course_name,st.studentfname,st.studentlname,st.student_id,m.assess1,m.assess2,m.attendance,m.midsem,m.endsem,m.grade,m.marksobtained from courses_enrolled ce join course c on ce.course_code=c.course_code join student_info st on st.student_id=ce.student_id join marks m on m.student_id=st.student_id and m.course_code=ce.course_code join attendance a on a.student_id=st.student_id and a.course_code=ce.course_code WHERE ce.student_id=$1 AND ce.semester=4",[x])
      const gpacalculate=await db.query("SELECT FINDGPA($1)",[x]);
      //console.log(gpacalculate);
      const insertgpa=await db.query("update gpa set sem4=$1 where student_id=$2",[gpacalculate.rows[0].findgpa,x]);
        //console.log(grade);
  if(response2.rowCount){
    //console.log(response2.rows);
    res.render(__dirname+"/view/studentmarks.ejs",{courses:response2,marks:marksSecured,gradeget:grade,gpaget:gpacalculate})
}});

//student logout
app.get("/stlogout",(req, res)=>
{
  isstudentlogin = false;
  res.render(__dirname + "/view/studentlogin.ejs", {wrongup: true});
});
//staff logout
app.get("/stafflogout",(req, res)=>
  {
    isstafflogin = false;
    res.render(__dirname + "/view/stafflogin.ejs", {wrongup: true});
  });
//render to staff login in nav bar
app.get("/stafflogin",(req, res)=>
{
  res.render(__dirname + "/view/stafflogin.ejs");
});
//render to homepage in nav bar
app.get("/homepage",(req, res)=>
{
  res.render(__dirname + "/view/homepage.ejs");
});

//render to studenlogin page in nav bar
app.get("/studentlogin",(req, res)=>
{
  res.render(__dirname + "/view/studentlogin.ejs", {wrongup: true});
});

//staff pages

//render to update page
app.get('/markscheck',async (req, res)=>
{
  const name=await db.query("Select staff_name from staff_info where staff_id=$1",[x]);
  res.render(__dirname + "/view/markscheck.ejs",{staff:name});
})

 //render to update marks page after validation
app.post('/marksvalidate', async (req, res)=>
  {
    const name=await db.query("Select staff_name from staff_info where staff_id=$1",[x]);
    const responses= await db.query("SELECT ce.*,s.studentlname,s.studentfname,c.course_name FROM courses_enrolled ce join student_info s on s.student_id=ce.student_id join course c on c.course_code=ce.course_code where staff_id=$1 and ce.student_id=$2",[x,req.body.student_id]);
    y=req.body.student_id;

    
    if( responses.rowCount){
    
      const fetchmarks=await db.query("select assess1,assess2,midsem,endsem from marks where student_id=$1 and course_code=(select distinct course_code from courses_enrolled where staff_id=$2);",[req.body.student_id,x]);
      
      res.render(__dirname + "/view/marksenter.ejs",{staff:name,marks:fetchmarks,top:responses});
    }
    else{
      res.render(__dirname + "/view/markscheck.ejs",{info:2,staff:name});
    }
  })


  //render to enter the marks page
app.get('/marksenter',async (req, res)=>
{
  const name=await db.query("Select staff_name from staff_info where staff_id=$1",[x]);

  res.render(__dirname + "/view/marksenter.ejs",{staff:name});
})

  //render to update marks page
app.post('/marksupdate',async (req, res)=>
  {
    const name =await db.query("Select staff_name from staff_info where staff_id=$1",[x]);
    console.log("hi")
    const responses= await db.query("SELECT ce.*,s.studentlname,s.studentfname,c.course_name FROM courses_enrolled ce join student_info s on s.student_id=ce.student_id join course c on c.course_code=ce.course_code where staff_id=$1 and ce.student_id=$2",[x,y]);
    const response=await db.query("update marks set assess1=$1,assess2=$2,midsem=$3,endsem=$4 where course_code=(select distinct course_code from courses_enrolled where staff_id=$5) and student_id=$6",[req.body.assess1,req.body.assess2,req.body.midsem,req.body.endsem,x,y]);
    const fetchmarks=await db.query("select assess1,assess2,midsem,endsem from marks where student_id=$1 and course_code=(select distinct course_code from courses_enrolled where staff_id=$2);",[y,x]);

    res.render(__dirname + "/view/marksenter.ejs",{staff:name,info:1,marks:fetchmarks,top:responses});
  })

  //render to attendance section in nav bar
app.get('/attendancecheck',async(req, res)=>
{
  const name=await db.query("Select staff_name from staff_info where staff_id=$1",[x]);
  console.log(name.rows)
  res.render(__dirname + "/view/attendancecheck.ejs",{staff:name});
})

  //render to enter attendance page after validation
app.post('/attendancevalidate', async (req, res)=>
  {
    const name=await db.query("Select staff_name from staff_info where staff_id=$1",[x]);
    
    const responses= await db.query("SELECT ce.*,s.studentlname,s.studentfname,c.course_name FROM courses_enrolled ce join student_info s on s.student_id=ce.student_id join course c on c.course_code=ce.course_code where staff_id=$1 and ce.student_id=$2",[x,req.body.student_id]);
   
    y=req.body.student_id;
    if( responses.rowCount){
      
      const fetchatt=await db.query("select first_half,second_half,total from attendance where student_id=$1 and course_code=(select distinct course_code from courses_enrolled where staff_id=$2);",[req.body.student_id,x]);
    
      const store=[req.body.firsttotal,req.body.secondtotal];
      res.render(__dirname + "/view/attendanceenter.ejs",{staff:name,att:fetchatt,fixed:store,top:responses});
    }
    else{
      res.render(__dirname + "/view/attendancecheck.ejs",{info:2,staff:name});
    }
  })

  // render to attendance enter page
  app.get('/attendanceenter',async (req, res)=>
    {
      const name=await db.query("Select staff_name from staff_info where staff_id=$1",[x]);
    
      res.render(__dirname + "/view/attendanceenter.ejs",{staff:name});
    })
  // updating attendance 
    app.post('/attendanceupdate',async (req, res)=>
      {
        const name =await db.query("Select staff_name from staff_info where staff_id=$1",[x]);
        let total=Number(req.body.firsttotal)+Number(req.body.secondtotal);
        console.log(total);
        const store=[req.body.firsttotal,req.body.secondtotal];
        //console.log(store);
        const responses= await db.query("SELECT ce.*,s.studentlname,s.studentfname,c.course_name FROM courses_enrolled ce join student_info s on s.student_id=ce.student_id join course c on c.course_code=ce.course_code where staff_id=$1 and ce.student_id=$2",[x,y]);
        const response=await db.query("update attendance set first_half=$1,second_half=$2,total=$3 where course_code=(select distinct course_code from courses_enrolled where staff_id=$4) and student_id=$5",[req.body.firstatt,req.body.secondatt,total,x,y]);
        const fetchatt=await db.query("select first_half,second_half,total from attendance where student_id=$1 and course_code=(select distinct course_code from courses_enrolled where staff_id=$2);",[y,x]);
        //console.log(store[0]);
        res.render(__dirname + "/view/attendanceenter.ejs",{staff:name,info:1,att:fetchatt,fixed:store,top:responses});
      })
    
// staff enrollling page
app.get("/staffenroll", async(req, res)=>
  {

    const response=await db.query("Select staff_name from staff_info where staff_id=$1",[x]);
    res.render(__dirname + "/view/staffenroll.ejs",{staff:response})
  });
// enrolling staff (inserting details)
app.post("/staffenrollinsert", async(req, res)=>
    {
      const check= await db.query("SELECT * FROM courses_enrolled WHERE student_id=$1 AND course_code=$2",[req.body.enrollid,req.body.enrollcourseid]);
      const check1 = await db.query("SELECT * FROM student_info where student_id=$1",[req.body.enrollid]);
      const check2 = await db.query("SELECT * FROM course where course_code=$1",[req.body.enrollcourseid]);
      const responses=await db.query("Select staff_name from staff_info where staff_id=$1",[x]);
      if(!check.rowCount && check1.rowCount && check2.rowCount){
      const response= await db.query("INSERT INTO courses_enrolled(student_id,course_code,staff_id,semester) VALUES($1,$2,$3,$4)",[req.body.enrollid,req.body.enrollcourseid,x,4]);
      if(response){
      res.render(__dirname + "/view/staffenroll.ejs",{info:1,staff:responses});
      }
      }
      else{
        if(!check1.rowCount || !check2.rowCount){
          res.render(__dirname + "/view/staffenroll.ejs",{info:3,staff: responses});
        }
        else{
        res.render(__dirname + "/view/staffenroll.ejs",{info:2,staff: responses});
        }
      }
    });
    //rendering to additional info
    app.get("/stadditionalinfo",async (req, res)=>
      {
         const response = await db.query("SELECT a.*,s.studentfname,s.studentlname FROM additional_info a join student_info s on s.student_id =a.student_id where s.student_id=$1",[x])
         console.log(response)
         res.render(__dirname + "/view/additionalstudent.ejs",{student:response});
        })
    // render to view student details page
    app.get("/viewstdetails",async (req, res)=>
          {
            const name=await db.query("Select staff_name from staff_info where staff_id=$1",[x]);
            console.log(name.rows)
            res.render(__dirname + "/view/studentidtoview.ejs",{staff:name})
            })
     app.post("/viewstudentdetails",async (req, res)=>
      {

        res.render(__dirname + "/view/viewstudentdetails.ejs",{student:details})
        })

//updating additional info
app.post("/updateadditionalinfo",async (req, res)=>
  {
    let response= await db.query("Update additional_info set sports=$1,certifications=$2,projects=$3,internship=$4,clubs=$5,extra_curricular=$6,otherskills=$7 where student_id=$8",[req.body.sports,req.body.certi,req.body.proj,req.body.intern,req.body.club,req.body.eca,req.body.others,x])
    response = await db.query("SELECT a.*,s.studentfname,s.studentlname FROM additional_info a join student_info s on s.student_id =a.student_id where s.student_id=$1",[x])
    console.log(response)
    res.render(__dirname + "/view/additionalstudent.ejs",{student:response,info:1});
    })


app.post("/validateid",async (req, res)=>
  {
    const name=await db.query("Select staff_name from staff_info where staff_id=$1",[x]);
    let response= await db.query("select * from student_info where student_id=$1",[req.body.id])
    if(!response.rowCount){
      res.render(__dirname + "/view/studentidtoview.ejs",{info:1,staff:name});
    }
    else{
      response=await db.query("select * from student_info s join additional_info a on s.student_id=a.student_id where s.student_id=$1",[req.body.id])
    //console.log(response)
    res.render(__dirname + "/view/viewstudentdetails.ejs",{student:response});
    }
    })
                   

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });
  
