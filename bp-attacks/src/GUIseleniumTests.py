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

def gui_test(driver):

    #CreateBLModel( nodeNum,subprocesses=False)
    
    
    # Wait until an element is present (e.g., an element with id 'content')
    try:
        upload_file = "/Users/charlesment/Version_2/Interactive-Visualisation-of-Attack-Traces-on-Attributed-Graphs/bp-attacks/src/wf102.json"

        time.sleep(3)

        file_input = driver.find_element(By.CSS_SELECTOR, "input[type='file']")
        file_input.send_keys(upload_file)  

        driver.execute_script("console.log(json);")

        time.sleep(500)
    
    finally:
        driver.refresh()
   

        

if __name__ == '__main__':
    url = "http://localhost:3000"
    options = webdriver.ChromeOptions()
    options.set_capability('goog:loggingPrefs', {'browser': 'DEBUG'})
    driver = webdriver.Chrome(options=options)

    # Open the webpage
    driver.get(url)

    gui_test(driver)

    # Close the browser
    driver.quit()

    
