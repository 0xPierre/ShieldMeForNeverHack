document.addEventListener('DOMContentLoaded', function() {
  const changeColorBtn = document.getElementById('changeColorBtn');
  
  // Add click event listener to the button
  changeColorBtn.addEventListener('click', function() {
    // Get the body element
    const body = document.body;
    
    // Generate a random color
    const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);
    
    // Change the background color
    body.style.backgroundColor = randomColor;
  });
});