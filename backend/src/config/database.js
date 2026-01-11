import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'appticket',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: process.env.NODE_ENV === 'production' ? 20 : 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  dialectOptions: {
    statement_timeout: 30000, // 30 segundos
    query_timeout: 30000, // 30 segundos
    connect_timeout: 10000 // 10 segundos para conexão
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  }
});

// Testar conexão
export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ Conexão com o banco de dados estabelecida com sucesso.');
    return true;
  } catch (error) {
    console.error('✗ Erro ao conectar com o banco de dados:', error.message);
    return false;
  }
};

export default sequelize;

