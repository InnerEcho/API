'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableName = 'missions';
    const tableExists = await queryInterface.describeTable(tableName).catch(() => null);
    if (tableExists) {
      console.log('Missions table already exists, skipping creation');
      return;
    }

    await queryInterface.createTable(tableName, {
      mission_id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
        comment: '미션 ID (PK)'
      },
      code: {
        type: Sequelize.STRING(64),
        allowNull: false,
        unique: true,
        comment: '미션 코드 (UNIQUE)'
      },
      title: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: '미션 제목'
      },
      desc: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '미션 설명'
      },
      type: {
        type: Sequelize.ENUM('instant', 'action', 'ar_optional', 'habit'),
        allowNull: false,
        comment: '미션 타입'
      },
      burden: {
        type: Sequelize.TINYINT,
        allowNull: false,
        comment: '부담도'
      },
      exp_reward: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 5,
        comment: '경험치 보상'
      },
      ar_bonus_exp: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'AR 보너스 경험치'
      },
      requires_ar_action: {
        type: Sequelize.ENUM('PET', 'JUMP', 'WATER', 'SUNLIGHT'),
        allowNull: true,
        comment: '필요한 AR 행동'
      },
      cooldown_sec: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '쿨다운 (초)'
      },
      is_active: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 1,
        comment: '활성 여부'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: '생성 일자'
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
        comment: '수정 일자'
      }
    });

    await queryInterface.addIndex(tableName, {
      name: 'missions_is_active_idx',
      fields: ['is_active']
    });

    await queryInterface.addIndex(tableName, {
      name: 'missions_type_burden_idx',
      fields: ['type', 'burden']
    });
  },

  async down(queryInterface) {
    const tableName = 'missions';
    await queryInterface.dropTable(tableName);
  }
};
