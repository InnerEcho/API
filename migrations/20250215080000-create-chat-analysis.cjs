'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableName = 'chat_analysis';
    const tableExists = await queryInterface
      .describeTable(tableName)
      .catch(() => null);
    if (tableExists) {
      console.log('chat_analysis table already exists, skipping creation');
      return;
    }

    await queryInterface.createTable(tableName, {
      analysis_id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
        comment: '분석 레코드 ID (PK)',
      },
      history_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'plant_history',
          key: 'history_id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        comment: '대화 히스토리 FK',
      },
      emotion: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: '감정 분석 결과',
      },
      factor: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '추출된 요인(하이라이트)',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: '분석 기록 생성 시각',
      },
    });

    await queryInterface.addConstraint(tableName, {
      type: 'unique',
      name: 'chat_analysis_history_unique',
      fields: ['history_id'],
    });

    await queryInterface.addIndex(tableName, {
      name: 'chat_analysis_emotion_idx',
      fields: ['emotion'],
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('chat_analysis');
  },
};
