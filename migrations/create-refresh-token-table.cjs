'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 테이블이 이미 존재하는지 확인
    const tableExists = await queryInterface.describeTable('refresh_token').catch(() => null);
    if (tableExists) {
      console.log('refresh_token table already exists, skipping creation');
      return;
    }

    await queryInterface.createTable('refresh_token', {
      token_id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        comment: 'Refresh Token ID (Primary Key)',
      },
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        comment: '사용자 ID (Foreign Key)',
        references: {
          model: 'user', // 참조할 테이블
          key: 'user_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      token: {
        type: Sequelize.STRING(500),
        allowNull: false,
        unique: true,
        comment: 'Refresh Token 값',
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: '만료 시간',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: '생성 날짜',
      },
      ip_address: {
        type: Sequelize.STRING(45), // IPv6 지원
        allowNull: true,
        comment: '클라이언트 IP 주소',
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '클라이언트 User-Agent',
      },
      is_revoked: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: '토큰 무효화 여부',
      },
    });

    // 인덱스 추가
    const indexes = await queryInterface.showIndex('refresh_token').catch(() => []);

    if (!indexes.some((index) => index.name === 'idx_user_id')) {
      await queryInterface.addIndex('refresh_token', {
        name: 'idx_user_id',
        fields: ['user_id'],
      });
    }

    if (!indexes.some((index) => index.name === 'idx_token')) {
      await queryInterface.addIndex('refresh_token', {
        name: 'idx_token',
        unique: true,
        fields: ['token'],
      });
    }

    if (!indexes.some((index) => index.name === 'idx_expires_at')) {
      await queryInterface.addIndex('refresh_token', {
        name: 'idx_expires_at',
        fields: ['expires_at'],
      });
    }

    console.log('refresh_token table created successfully');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('refresh_token');
  },
};
