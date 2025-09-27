'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const ensureDateColumn = async (tableName, columnName, { withOnUpdate = false } = {}) => {
      const table = await queryInterface.describeTable(tableName);
      if (!table[columnName]) {
        // 컬럼이 없으면 추가
        const colDef = {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        };
        if (withOnUpdate) {
          colDef.onUpdate = 'CURRENT_TIMESTAMP';
        }
        await queryInterface.addColumn(tableName, columnName, colDef);
        return;
      }
      // 임시 NULL 허용 후 기본값/업데이트 설정
      await queryInterface.changeColumn(tableName, columnName, { type: Sequelize.DATE, allowNull: true });
      const colDef2 = {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      };
      if (withOnUpdate) {
        colDef2.onUpdate = 'CURRENT_TIMESTAMP';
      }
      await queryInterface.changeColumn(tableName, columnName, colDef2);
    };

    // 세션 SQL_MODE에서 NO_ZERO_DATE/NO_ZERO_IN_DATE 제거 (제로데이트 업데이트 허용)
    await queryInterface.sequelize.query("SET @OLD_SQL_MODE = @@SQL_MODE");
    await queryInterface.sequelize.query("SET SESSION SQL_MODE = REPLACE(REPLACE(@@SQL_MODE,'NO_ZERO_DATE',''),'NO_ZERO_IN_DATE','')");

    // 1) 기존 잘못된 제로데이트 값을 현재시각으로 교정
    const tryFixZeroDate = async (tableName, columnName) => {
      const table = await queryInterface.describeTable(tableName);
      if (table[columnName]) {
        await queryInterface.sequelize.query(`UPDATE \`${tableName}\` SET \`${columnName}\` = NOW() WHERE \`${columnName}\` = '0000-00-00 00:00:00'`);
      }
    };
    await tryFixZeroDate('user', 'created_at');
    await tryFixZeroDate('event', 'created_at');
    await tryFixZeroDate('growth_diary', 'created_at');
    await tryFixZeroDate('growth_diary', 'updated_at');
    await tryFixZeroDate('growth_diary_comment', 'created_at');
    await tryFixZeroDate('growth_diary_comment', 'updated_at');

    // 2) 스키마 기본값/제약 수정
    await ensureDateColumn('user', 'created_at');
    await ensureDateColumn('event', 'created_at');
    await ensureDateColumn('growth_diary', 'created_at');
    await ensureDateColumn('growth_diary', 'updated_at', { withOnUpdate: true });
    await ensureDateColumn('growth_diary_comment', 'created_at');
    await ensureDateColumn('growth_diary_comment', 'updated_at', { withOnUpdate: true });

    // 세션 SQL_MODE 복원
    await queryInterface.sequelize.query("SET SESSION SQL_MODE = @OLD_SQL_MODE");
  },

  async down (queryInterface, Sequelize) {
    const maybeDropDefault = async (tableName, columnName) => {
      const table = await queryInterface.describeTable(tableName);
      if (table[columnName]) {
        await queryInterface.changeColumn(tableName, columnName, { type: Sequelize.DATE, allowNull: false });
      }
    };
    await maybeDropDefault('user', 'created_at');
    await maybeDropDefault('event', 'created_at');
    await maybeDropDefault('growth_diary', 'created_at');
    await maybeDropDefault('growth_diary', 'updated_at');
    await maybeDropDefault('growth_diary_comment', 'created_at');
    await maybeDropDefault('growth_diary_comment', 'updated_at');
  }
};
