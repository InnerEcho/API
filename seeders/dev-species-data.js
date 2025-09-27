'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // NODE_ENV가 development일 때만 실행
    if (process.env.NODE_ENV !== 'development') {
      console.log('Dev species data seeder skipped - NODE_ENV is not development');
      return;
    }

    // 개발용 더미 species 데이터
    const devSpeciesData = [
      {
        species_name: '개발용_테스트_식물_1',
        max_temp: 25.0,
        min_temp: 20.0,
        max_light: 1000.0,
        min_light: 500.0,
        max_moisture: 60.0,
        min_moisture: 30.0,
        opt_watering: 5
      },
      {
        species_name: '개발용_테스트_식물_2',
        max_temp: 30.0,
        min_temp: 15.0,
        max_light: 1500.0,
        min_light: 200.0,
        max_moisture: 80.0,
        min_moisture: 20.0,
        opt_watering: 3
      },
      {
        species_name: '개발용_테스트_식물_3',
        max_temp: 22.0,
        min_temp: 18.0,
        max_light: 800.0,
        min_light: 400.0,
        max_moisture: 70.0,
        min_moisture: 40.0,
        opt_watering: 7
      },
      {
        species_name: '개발용_테스트_식물_4',
        max_temp: 35.0,
        min_temp: 10.0,
        max_light: 2000.0,
        min_light: 100.0,
        max_moisture: 50.0,
        min_moisture: 10.0,
        opt_watering: 14
      },
      {
        species_name: '개발용_테스트_식물_5',
        max_temp: 28.0,
        min_temp: 12.0,
        max_light: 1200.0,
        min_light: 300.0,
        max_moisture: 65.0,
        min_moisture: 25.0,
        opt_watering: 10
      }
    ];

    // findOrCreate를 사용하여 중복 방지
    for (const species of devSpeciesData) {
      await queryInterface.sequelize.query(`
        INSERT IGNORE INTO species (species_name, max_temp, min_temp, max_light, min_light, max_moisture, min_moisture, opt_watering)
        VALUES (:species_name, :max_temp, :min_temp, :max_light, :min_light, :max_moisture, :min_moisture, :opt_watering)
      `, {
        replacements: species
      });
    }

    console.log('Dev species data seeded successfully');
  },

  async down (queryInterface, Sequelize) {
    // NODE_ENV가 development일 때만 실행
    if (process.env.NODE_ENV !== 'development') {
      console.log('Dev species data seeder rollback skipped - NODE_ENV is not development');
      return;
    }

    // 개발용 더미 데이터 삭제
    await queryInterface.bulkDelete('species', {
      species_name: {
        [queryInterface.sequelize.Sequelize.Op.like]: '개발용_테스트_식물_%'
      }
    });

    console.log('Dev species data removed successfully');
  }
};
