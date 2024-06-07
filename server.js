const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3030;

// Позволяет express обрабатывать данные формы
app.use(express.urlencoded({ extended: true }));
// Включаем CORS для всех запросов
app.use(cors());

// Путь к файлу users.json
const filePath = path.join(__dirname, 'users.json');

// Функция для чтения данных из файла
async function readFile() {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Ошибка при чтении файла:', error);
    return [];
  }
}

// Функция для записи данных в файл
async function writeFile(users) {
  try {
    const data = JSON.stringify(users, null, 2);
    await fs.writeFile(filePath, data, 'utf8');
    console.log('Данные успешно записаны в файл');
  } catch (error) {
    console.error('Ошибка при записи в файл:', error);
  }
}

// Обработка GET-запроса для получения списка пользователей
app.get('/users', async (_, res) => {
  // Читаем текущих пользователей из файла и отправляем их клиенту
  const users = await readFile();
  res.json(users);
});


// ============= Регистранция =====================
// Обработка POST-запроса при регистрации пользователя
app.post('/register', async (req, res) => {
  const { contact_name, contact_last_name, contact_email, contact_password } = req.body;
  // Создаем нового пользователя
  // Читаем текущих пользователей из файла users.json
  const usersInData = await readFile();

  // Проверяем, существует ли пользователь с таким email
  const isDuplicate = usersInData.some(user => user.email === contact_email);
  if (isDuplicate) {
    return res.status(400).send('Пользователь с таким email уже зарегистрирован');
  }

  const newUser = {
    id: Date.now(), // Уникальный ID для пользователя
    name: contact_name,
    lastName: contact_last_name,
    email: contact_email,
    password: contact_password, // В реальном приложении нужно хешировать пароль
    comments: [
      {
        id: Math.random().toString(16).slice(2),
        text: 'Первый комментарий',
        date: new Date(),
      }
    ],
  };

  // Читаем текущих пользователей и добавляем нового
  const users = await readFile();
  users.push(newUser);
  await writeFile(users);

  res.send('Пользователь успешно зарегистрирован');
});


// ============= Товары =====================
// Путь к файлу product.json
const filePathProd = path.join(__dirname, 'product.json');

// Функция для чтения данных из файла product.json
async function readProducts() {
  try {
    const data = await fs.readFile(filePathProd, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Ошибка при чтении файла product.json:', error);
    return [];
  }
}
// Функция для записи данных в файл product.json
async function writeProducts(products) {
  try {
    const data = JSON.stringify(products, null, 2);
    await fs.writeFile(filePathProd, data, 'utf8');
    console.log('Данные успешно записаны в файл product.json');
  } catch (error) {
    console.error('Ошибка при записи в файл product.json:', error);
  }
}
// Маршрут для получения данных о продуктах
app.get('/products', async (req, res) => {
  try {
    const products = await readProducts();
    res.json(products);
  } catch (error) {
    res.status(500).send('Ошибка сервера при загрузке данных о продуктах');
  }
});

// Маршрут для добавления комментария к продукту
app.post('/:productId', async (req, res) => {
  const { productId } = req.params;
  console.log(req.body); // Проверка содержимого req.body
  const { email, comment } = req.body;
  console.log(email, comment); // Проверка значений email и comment

  try {
    const products = await readProducts();
    const product = products.find(p => p.id == productId);

    if (!product) {
      return res.status(404).send('Продукт не найден');
    }

    const newComment = {
      id: Math.random().toString(16).slice(2),
      email,
      text: comment,
      date: new Date(),
    };

    product.comments = product.comments || [];
    product.comments.push(newComment);

    await writeProducts(products);

    res.send('Комментарий успешно добавлен');
  } catch (error) {
    console.error('Ошибка при добавлении комментария:', error);
    res.status(500).send('Ошибка сервера при добавлении комментария');
  }
});

// Маршрут для получения комментариев к продукту по productId
app.get('/:productId', async (req, res) => {
  const { productId } = req.params;

  try {
    const products = await readProducts();
    const product = products.find(p => p.id == productId);

    if (!product) {
      return res.status(404).send('Продукт не найден');
    }

    const comments = product.comments || [];

    // Для каждого комментария добавляем рейтинг
    const commentsWithRating = comments.map(comment => ({
      ...comment,
    }));

    res.json(commentsWithRating);
  } catch (error) {
    console.error('Ошибка при получении комментариев:', error);
    res.status(500).send('Ошибка сервера при получении комментариев');
  }
});

// Маршрут для обновления рейтинга продукта
app.put('/:productId', async (req, res) => {
  const { productId } = req.params;
  const { rating } = req.body;

  try {
    const products = await readProducts();
    const productIndex = products.findIndex(p => p.id == productId);

    if (productIndex === -1) {
      return res.status(404).send('Продукт не найден');
    }

    // Обновляем рейтинг продукта
    products[productIndex].rate = Number(rating);

    await writeProducts(products);

    res.json(products[productIndex]);
  } catch (error) {
    console.error('Ошибка при обновлении рейтинга продукта:', error);
    res.status(500).send('Ошибка сервера при обновлении рейтинга продукта');
  }
});


app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});