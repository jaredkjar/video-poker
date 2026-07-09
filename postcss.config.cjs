module.exports = {
  plugins: {
    // Convert the stylesheet's px values to rem so the whole UI scales with
    // the fluid root font-size set on <html> in index.css. Hairlines (<2px)
    // stay px so borders remain crisp, and media-query breakpoints stay px.
    'postcss-pxtorem': {
      rootValue: 16,
      propList: ['*'],
      minPixelValue: 2,
      selectorBlackList: [/^html$/],
    },
  },
};
