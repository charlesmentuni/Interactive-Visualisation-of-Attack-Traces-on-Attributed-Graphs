import requests as rq
from bs4 import BeautifulSoup as bs
import json
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from urllib.parse import urlparse
import re
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
from createBlFaultData import CreateBLModel
import matplotlib.pyplot as plt


import numpy as np

def performance_test(driver,nodeNum):

    CreateBLModel( nodeNum,subprocesses=True)
    
    
    # Wait until an element is present (e.g., an element with id 'content')
    try:
        upload_file = "/Users/charlesment/Version_2/Interactive-Visualisation-of-Attack-Traces-on-Attributed-Graphs/bp-attacks/src/wf111.json"
        file_input = driver.find_element(By.CSS_SELECTOR, "input[type='file']")
        file_input.send_keys(upload_file)  
        time.sleep(600)

        text = driver.get_log('browser')

        match = re.search(r"timeGraph\" \s*([\d.]+)", str(text))
        match1 = re.search(r"nodeNum\" \s*([\d.]+)\'", str(text))

        timeTaken = None
        nodesNum = None
        if match and match1:
            timeTaken = match.group(1)
            nodesNum = match1.group(1)
            

            
    
    finally:
        driver.refresh()
        return timeTaken, nodesNum
   
def plot_test_data(tests):

    

    # plot
    fig, ax = plt.subplots()

    x = tests[:, 0]
    y = tests[:, 1]

    ax.scatter(x, y)

   

    plt.show()

        

if __name__ == '__main__':
    url = "http://localhost:3000"
    options = webdriver.ChromeOptions()
    options.set_capability('goog:loggingPrefs', {'browser': 'DEBUG'})
    driver = webdriver.Chrome(options=options)
    # Open the webpage
    driver.get(url)
    tests = np.ndarray((int(300/10)*5, 2))
    for j in range(5):
        for i in range(10, 310, 10):
            timeTaken, nodesNum = performance_test(driver, 3)
            tests[int(i/10)-1] = [nodesNum, timeTaken]
    plot_test_data(tests)