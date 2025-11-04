export default {
  presets: [
    ['@babel/preset-env', { 
      targets: { node: 'current' },
      modules: false
    }],
    ['@babel/preset-typescript', { allowDeclareFields: true }],
  ],
  plugins: [
    ['module-resolver', {
      root: ['./src'],
      alias: {
        '@': './src',
      },
      extensions: ['.ts', '.js', '.json'],
    }],
  ],
};
