'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // 필수 species 데이터 (운영 환경에서도 필요한 기본 데이터)
    const essentialSpeciesData = [
      {
        species_name: '몬스테라',
        max_temp: 30.0,
        min_temp: 18.0,
        max_light: 2000.0,
        min_light: 500.0,
        max_moisture: 80.0,
        min_moisture: 40.0,
        opt_watering: 7
      },
      {
        species_name: '고무나무',
        max_temp: 28.0,
        min_temp: 15.0,
        max_light: 1500.0,
        min_light: 300.0,
        max_moisture: 70.0,
        min_moisture: 30.0,
        opt_watering: 10
      },
      {
        species_name: '산세베리아',
        max_temp: 35.0,
        min_temp: 10.0,
        max_light: 3000.0,
        min_light: 200.0,
        max_moisture: 50.0,
        min_moisture: 10.0,
        opt_watering: 14
      },
      {
        species_name: '스투키',
        max_temp: 32.0,
        min_temp: 12.0,
        max_light: 2500.0,
        min_light: 400.0,
        max_moisture: 60.0,
        min_moisture: 20.0,
        opt_watering: 12
      },
      {
        species_name: '필로덴드론',
        max_temp: 28.0,
        min_temp: 16.0,
        max_light: 1800.0,
        min_light: 400.0,
        max_moisture: 75.0,
        min_moisture: 35.0,
        opt_watering: 8
      }
    ];

    // findOrCreate를 사용하여 중복 방지
    for (const species of essentialSpeciesData) {
      await queryInterface.sequelize.query(`
        INSERT IGNORE INTO species (species_name, max_temp, min_temp, max_light, min_light, max_moisture, min_moisture, opt_watering)
        VALUES (:species_name, :max_temp, :min_temp, :max_light, :min_light, :max_moisture, :min_moisture, :opt_watering)
      `, {
        replacements: species
      });
    }
  },

  async down (queryInterface, Sequelize) {
    // 필수 데이터는 운영 환경에서 삭제하지 않음
    // 필요시 수동으로 삭제
    console.log('Essential species data should not be deleted in production');
  }
};
