'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('growth_diary');

    if (!table.dominant_emotion) {
      await queryInterface.addColumn('growth_diary', 'dominant_emotion', {
        type: Sequelize.STRING(64),
        allowNull: true,
        comment: '오늘 일기의 대표 감정',
        after: 'title',
      });
    }

    if (!table.emotion_factor) {
      await queryInterface.addColumn('growth_diary', 'emotion_factor', {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '대표 감정의 요인 설명',
        after: 'dominant_emotion',
      });
    }

    if (!table.primary_mission) {
      await queryInterface.addColumn('growth_diary', 'primary_mission', {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: '대표 미션 이름(오늘 가장 먼저 완료한 미션)',
        after: 'emotion_factor',
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('growth_diary');

    if (table.primary_mission) {
      await queryInterface.removeColumn('growth_diary', 'primary_mission');
    }

    if (table.emotion_factor) {
      await queryInterface.removeColumn('growth_diary', 'emotion_factor');
    }

    if (table.dominant_emotion) {
      await queryInterface.removeColumn('growth_diary', 'dominant_emotion');
    }
  },
};
