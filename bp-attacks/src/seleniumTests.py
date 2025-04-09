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

    CreateBLModel( nodeNum,subprocesses=False)
    
    
    # Wait until an element is present (e.g., an element with id 'content')
    try:
        upload_file = "/Users/charlesment/Version_2/Interactive-Visualisation-of-Attack-Traces-on-Attributed-Graphs/bp-attacks/src/wf111.json"
        file_input = driver.find_element(By.CSS_SELECTOR, "input[type='file']")
        file_input.send_keys(upload_file)  

        text = driver.get_log('browser')

        match = re.search(r"\"timeGraph\" \s*([\d.]+)", str(text))
        match1 = re.search(r"\"nodeNum\" \s*([\d.]+)\'", str(text))
        while not match or not match1:
            text = driver.get_log('browser')
            if not match:
                match = re.search(r"timeGraph\" \s*([\d.]+)", str(text))
            if not match1:
                match1 = re.search(r"nodeNum\" \s*([\d.]+)\'", str(text))
            
            time.sleep(0.1)
        
    
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
    ax.set_xlabel('Number of Nodes')
    ax.set_ylabel('Time Taken to Initialise (milliseconds)')
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
    iterations = 5
    initNum = 2000
    tests = np.ndarray((int(initNum/10)*5, 2))
    for j in range(iterations):
        for i in range(10, initNum, 10):
            timeTaken, nodesNum = performance_test(driver, i)
            print(f"Time taken for {nodesNum} nodes: {timeTaken}")
            tests[int(i/10)-1] = [float(nodesNum), float(timeTaken)]
    f = open("bp-attacks/src/test.txt", "w")
    f.write(str(tests))
    f.close()
    
    plot_test_data(tests)