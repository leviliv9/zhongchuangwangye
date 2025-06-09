// server.js
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const mysql = require('mysql2/promise');

const app = express();
const upload = multer({ dest: 'uploads/' });

// 数据库连接配置
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'equipment_company'
};

// 中间件
app.use(bodyParser.json());
app.use(express.static('public'));

// 公司信息API
app.get('/api/company', async (req, res) => {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.query('SELECT * FROM company_info LIMIT 1');
    conn.end();
    res.json(rows[0] || {});
});

app.put('/api/company', async (req, res) => {
    const { name, description, phone, email, wechat, address } = req.body;
    const conn = await mysql.createConnection(dbConfig);
    await conn.query(
        'REPLACE INTO company_info (id, name, description, phone, email, wechat, address) VALUES (1, ?, ?, ?, ?, ?, ?)',
        [name, description, phone, email, wechat, address]
    );
    conn.end();
    res.json({ success: true });
});

// 产品API
app.get('/api/products', async (req, res) => {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.query('SELECT * FROM products ORDER BY created_at DESC');
    conn.end();
    res.json(rows);
});

app.post('/api/products', upload.single('image'), async (req, res) => {
    const { name, description, specs } = req.body;
    const imagePath = req.file ? req.file.path : '';
    
    const conn = await mysql.createConnection(dbConfig);
    const [result] = await conn.query(
        'INSERT INTO products (name, description, specs, image) VALUES (?, ?, ?, ?)',
        [name, description, specs, imagePath]
    );
    conn.end();
    res.json({ id: result.insertId });
});

app.put('/api/products/:id', upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const { name, description, specs } = req.body;
    const imagePath = req.file ? req.file.path : null;
    
    let query = 'UPDATE products SET name = ?, description = ?, specs = ?';
    const params = [name, description, specs];
    
    if (imagePath) {
        query += ', image = ?';
        params.push(imagePath);
    }
    
    query += ' WHERE id = ?';
    params.push(id);
    
    const conn = await mysql.createConnection(dbConfig);
    await conn.query(query, params);
    conn.end();
    res.json({ success: true });
});

app.delete('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    const conn = await mysql.createConnection(dbConfig);
    await conn.query('DELETE FROM products WHERE id = ?', [id]);
    conn.end();
    res.json({ success: true });
});

// 新闻API
app.get('/api/news', async (req, res) => {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.query('SELECT * FROM news ORDER BY publish_date DESC');
    conn.end();
    res.json(rows);
});

app.post('/api/news', async (req, res) => {
    const { title, content, publish_date } = req.body;
    const conn = await mysql.createConnection(dbConfig);
    const [result] = await conn.query(
        'INSERT INTO news (title, content, publish_date) VALUES (?, ?, ?)',
        [title, content, publish_date || new Date()]
    );
    conn.end();
    res.json({ id: result.insertId });
});

app.put('/api/news/:id', async (req, res) => {
    const { id } = req.params;
    const { title, content, publish_date } = req.body;
    const conn = await mysql.createConnection(dbConfig);
    await conn.query(
        'UPDATE news SET title = ?, content = ?, publish_date = ? WHERE id = ?',
        [title, content, publish_date, id]
    );
    conn.end();
    res.json({ success: true });
});

app.delete('/api/news/:id', async (req, res) => {
    const { id } = req.params;
    const conn = await mysql.createConnection(dbConfig);
    await conn.query('DELETE FROM news WHERE id = ?', [id]);
    conn.end();
    res.json({ success: true });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});