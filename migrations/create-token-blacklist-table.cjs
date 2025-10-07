'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 테이블이 이미 존재하는지 확인
    const tableExists = await queryInterface.describeTable('token_blacklist').catch(() => null);
    if (tableExists) {
      console.log('token_blacklist table already exists, skipping creation');
      return;
    }

    await queryInterface.createTable('token_blacklist', {
      blacklist_id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        comment: 'Blacklist ID (Primary Key)',
      },
      token: {
        type: Sequelize.STRING(500),
        allowNull: false,
        unique: true,
        comment: '블랙리스트에 추가된 Access Token',
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: '토큰 만료 시간 (자동 삭제 기준)',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: '블랙리스트 추가 날짜',
      },
      reason: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: '블랙리스트 추가 사유 (logout, security 등)',
      },
    });

    // 인덱스 추가
    const indexes = await queryInterface.showIndex('token_blacklist').catch(() => []);

    if (!indexes.some((index) => index.name === 'idx_token')) {
      await queryInterface.addIndex('token_blacklist', {
        name: 'idx_token',
        unique: true,
        fields: ['token'],
      });
    }

    if (!indexes.some((index) => index.name === 'idx_expires_at')) {
      await queryInterface.addIndex('token_blacklist', {
        name: 'idx_expires_at',
        fields: ['expires_at'],
      });
    }

    console.log('token_blacklist table created successfully');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('token_blacklist');
  },
};
