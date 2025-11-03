'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableName = 'user_missions';
    const tableExists = await queryInterface.describeTable(tableName).catch(() => null);
    if (tableExists) {
      console.log('User missions table already exists, skipping creation');
      return;
    }

    await queryInterface.createTable(tableName, {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
        comment: '사용자 미션 ID (PK)'
      },
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        comment: '사용자 ID (FK)',
        references: {
          model: 'user',
          key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      mission_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        comment: '미션 ID (FK)',
        references: {
          model: 'missions',
          key: 'mission_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      status: {
        type: Sequelize.ENUM('assigned', 'complete', 'skipped', 'expired'),
        allowNull: false,
        defaultValue: 'assigned',
        comment: '미션 상태'
      },
      assigned_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: '할당 일자'
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: '완료 일자'
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: '만료 일자'
      },
      evidence: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: '미션 인증 자료 (JSON)'
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
      name: 'user_missions_user_id_status_idx',
      fields: ['user_id', 'status']
    });

    await queryInterface.addIndex(tableName, {
      name: 'user_missions_mission_id_idx',
      fields: ['mission_id']
    });

    await queryInterface.addIndex(tableName, {
      name: 'user_missions_unique_assignment',
      unique: true,
      fields: ['user_id', 'mission_id', 'assigned_at']
    });
  },

  async down(queryInterface) {
    const tableName = 'user_missions';
    await queryInterface.dropTable(tableName);
  }
};
