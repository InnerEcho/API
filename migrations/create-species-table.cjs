'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // 테이블이 이미 존재하는지 확인
    const tableExists = await queryInterface.describeTable('species').catch(() => null);
    if (tableExists) {
      console.log('Species table already exists, skipping creation');
      return;
    }

    await queryInterface.createTable('species', {
      species_id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        comment: "식물 종 ID"
      },
      species_name: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: "종 이름"
      },
      max_temp: {
        type: Sequelize.FLOAT,
        allowNull: false,
        comment: "최대 온도"
      },
      min_temp: {
        type: Sequelize.FLOAT,
        allowNull: false,
        comment: "최소 온도"
      },
      max_light: {
        type: Sequelize.FLOAT,
        allowNull: false,
        comment: "최대 조도"
      },
      min_light: {
        type: Sequelize.FLOAT,
        allowNull: false,
        comment: "최소 조도"
      },
      max_moisture: {
        type: Sequelize.FLOAT,
        allowNull: false,
        comment: "최대 토양 수분"
      },
      min_moisture: {
        type: Sequelize.FLOAT,
        allowNull: false,
        comment: "최소 토양 수분"
      },
      opt_watering: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: "물주기"
      }
    });

    // 유니크 인덱스 추가 (이미 존재하는지 확인)
    const indexes = await queryInterface.showIndex('species');
    const indexExists = indexes.some(index => index.name === 'species_name_unique');
    
    if (!indexExists) {
      await queryInterface.addIndex('species', {
        name: 'species_name_unique',
        unique: true,
        fields: ['species_name']
      });
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('species');
  }
};
