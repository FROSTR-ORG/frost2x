{
  test: /\.css$/,
  include: [
    path.resolve(__dirname, 'src/styles')
  ],
  use: ['style-loader', 'css-loader']
} 