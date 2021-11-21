const nodemailer = require('nodemailer')

exports.invite = async (emails, inviteLink) => {
  return new Promise((resolve, reject)=>{
    console.log('emails: ', emails)

    //Tiến hành gửi mail, nếu có gì đó bạn có thể xử lý trước khi gửi mail
    const transporter = nodemailer.createTransport({
      // config mail server
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL, //Tài khoản gmail vừa tạo
        pass: process.env.PASSWORD, //Mật khẩu tài khoản gmail vừa tạo
      },
      tls: {
        // do not fail on invalid certs
        rejectUnauthorized: false,
      },
    })
    const content = `
      <div style="padding: 10px; background-color: #003375">
          <div style="padding: 10px; background-color: white;">
              <h4 style="color: #0085ff">Nhấp vào link bên dưới để tham gia lớp học</h4>
              <span style="color: black">${inviteLink}</span>
          </div>
      </div>`
    const mainOptions = {
      // thiết lập đối tượng, nội dung gửi mail
      from: 'WebCTT2',
      to: emails.join(','),
      subject: 'Lời mời tham gia lớp học',
      text: '', //Thường thi mình không dùng cái này thay vào đó mình sử dụng html để dễ edit hơn
      html: content, //Nội dung html mình đã tạo trên kia :))
    }
    transporter.sendMail(mainOptions, function (err, info) {
      if (err) {
        console.error(err)
        reject('Gửi mail thất bại')
        // return { message: 'Gửi mail thất bại' }
      } else {
        console.log('success')
        resolve('Gửi mail thành công')
        // return { message: 'Gửi mail thành công' }
      }
    })
  })
  
}
