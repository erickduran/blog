var isOpen = false;
var firstTime = true;

document.addEventListener('DOMContentLoaded', function(){ 
	var button = document.getElementById('comments-title');
	var height = $('#comments-section').height();
	document.getElementById("comments-section").style.visibility = "hidden";
	document.getElementById('comments-section').style.height = "0px";

	button.addEventListener('click', function(){
    	if (!isOpen) {
			var disqus_shortname = 'erickduran-com';
			if (firstTime){
				$.ajax({
				    type: "GET",
				    url: "http://" + disqus_shortname + ".disqus.com/embed.js",
				    dataType: "script",
				    cache: true
				}); 
				firstTime = false;
			}
			else {
				DISQUS.reset({
				  reload: true
				});
			}
			document.getElementById("comments-section").style.visibility = "visible";

			$('#comments-title').animate({
				'opacity': '0.0'
			}, {
				duration: 100,
				complete: function() {
					button.innerHTML = "Hide comments";
					isOpen = true;
					$('#comments-title').animate({
						'opacity': '1.0'
					}, {
						duration: 100,
						complete: function() {
							$('#comments-section').animate({
								'height': '100%'
							}, {
								duration: 1000,
							});
						}
					});
				}
			});
    	}
    	else {
    		$('#comments-title').animate({
				'opacity': '0.0'
			}, {
				duration: 100,
				complete: function() {
					button.innerHTML = "Show comments";
					isOpen = false;
					$('#comments-title').animate({
						'opacity': '1.0'
					}, {
						duration: 100,
						complete: function() {
							$('#comments-section').animate({
								'height': '0'
							}, {
								duration: 1000,
								complete: function () {
									document.getElementById("comments-section").style.visibility = "hidden";
								}
							});
						}
					});
				}
			});
    	}
    });
});