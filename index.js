import express from 'express';
import TelegramBot from "node-telegram-bot-api";
import keyboards from "./keyboards/keyboards.js";
import { read, write } from "./utils/fs.js";

const app = express();
app.use(express.json())

const bot = new TelegramBot('5727492796:AAEnEDXA4Vohzmn21aRAbUVC0Ewf97lmT9w', {
  polling: true
})

bot.onText(/\/start/, msg => {
  console.log(msg);
  bot.sendMessage(msg.chat.id, `Salom ${msg.chat.first_name == undefined ? msg.from.first_name : msg.chat.first_name}`, {
    reply_markup: {
      keyboard:keyboards.menu,
      resize_keyboard:true
    }
  })
})

bot.on('message', msg => {
  if(msg.text == 'Bizning kurslar'){
    bot.sendMessage(msg.chat.id, 'Bizning kurslar', {
      reply_markup: {
        keyboard: keyboards.courses,
        resize_keyboard:true
      }
    })
  }

  if(msg.text == 'Asosiy menyu'){
    bot.sendMessage(msg.chat.id, 'Asosiy menyu', {
      reply_markup:{
        keyboard:keyboards.menu,
        resize_keyboard:true
      }
    })
  }

  const allCourses = read('courses.json').find(e => e.name == msg.text)
  if(allCourses){
    bot.sendPhoto(msg.chat.id, 'https://firebasestorage.googleapis.com/v0/b/images-5c23a.appspot.com/o/node%20js.png?alt=media&token=f19b549b-0747-4fa7-bbc3-126ff1d6925d', {
      caption: `
        <i>
          ${allCourses.desc}
        </i>\n<span class='tg-spoiler'>${allCourses.price}</span>
      `,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text:'Register',
             callback_data: `${allCourses.name}`
            }
          ]
        ]
      }
    })
  }
})

bot.on('callback_query', async msg => {
  if(msg.data){
    const userContact = await bot.sendMessage(msg.message.chat.id, 'Kontaktingizni ulashish', {
      reply_markup:JSON.stringify({
        keyboard:[
          [{
            text:'Kontaktingizni ulashish',
            request_contact: true
          }]
        ],
        resize_keyboard: true,
        one_time_keyboard: true
      })
    })

    bot.onReplyToMessage(userContact.chat.id, userContact.message_id, async contactMsg => {
      const allRequests = read('requests.json')

      allRequests.push({
        id: allRequests.at(-1)?.id + 1 || 1,
        courses: msg.data,
        name:contactMsg.contact.first_name,
        phone:contactMsg.contact.phone_number
      })

      const newAllRequests = await write('requests.json', allRequests)

      if(newAllRequests){
        await bot.sendMessage(msg.message.chat.id, 'Arizangiz qabul qilindi', {
          reply_markup:{
            keyboard:keyboards.menu,
            resize_keyboard:true
          }
        })

        await bot.sendMessage('-1001890591171', `
        course: ${msg.data},\naddress: ${contactMsg.contact.phone_number},\nname: ${contactMsg.from.first_name}`)

      }
    })
  }
})

app.get('/courses', (req, res) => {
  res.json(read('courses.json'))
})

app.post('/newCourse', async (req, res) => {
  const { name, price, desc } = req.body;

  const allCourses = read('courses.json')

  allCourses.push({
    id:allCourses.at(-1)?.id + 1 || 1,
    name, price, desc
  })

  await write('courses.json', allCourses)

  res.send('OK')
})

app.listen(process.env.PORT ?? 9090, console.log(process.env.PORT ?? 9090))