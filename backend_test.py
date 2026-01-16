#!/usr/bin/env python3
"""
URL Shortener Backend API Test Suite
Tests all endpoints of the URL shortener service
"""

import requests
import json
import sys
from datetime import datetime
import base64

# Configuration
BASE_URL = "https://shrinkurl.preview.emergentagent.com/api"

class URLShortenerTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.test_results = []
        self.created_urls = []
        
    def log_test(self, test_name, success, details):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })
        
    def test_create_shortened_url(self):
        """Test POST /api/shorten - Create shortened URL with random code"""
        print("\n=== Test 1: Create shortened URL with random code ===")
        
        payload = {"original_url": "https://www.google.com"}
        
        try:
            response = self.session.post(f"{self.base_url}/shorten", json=payload)
            
            if response.status_code != 200:
                self.log_test("Create shortened URL", False, f"Status code: {response.status_code}, Response: {response.text}")
                return None
                
            data = response.json()
            
            # Verify required fields
            required_fields = ["original_url", "short_code", "clicks", "created_at", "qr_code", "custom"]
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                self.log_test("Create shortened URL", False, f"Missing fields: {missing_fields}")
                return None
                
            # Verify field values
            if data["original_url"] != "https://www.google.com":
                self.log_test("Create shortened URL", False, f"Wrong original_url: {data['original_url']}")
                return None
                
            if data["clicks"] != 0:
                self.log_test("Create shortened URL", False, f"Clicks should be 0, got: {data['clicks']}")
                return None
                
            if data["custom"] != False:
                self.log_test("Create shortened URL", False, f"Custom should be False, got: {data['custom']}")
                return None
                
            if not data["qr_code"].startswith("data:image/png;base64,"):
                self.log_test("Create shortened URL", False, f"QR code format invalid: {data['qr_code'][:50]}...")
                return None
                
            # Verify QR code is valid base64
            try:
                qr_data = data["qr_code"].split(",")[1]
                base64.b64decode(qr_data)
            except Exception as e:
                self.log_test("Create shortened URL", False, f"Invalid base64 QR code: {e}")
                return None
                
            self.created_urls.append(data)
            self.log_test("Create shortened URL", True, f"Created URL with code: {data['short_code']}")
            return data
            
        except Exception as e:
            self.log_test("Create shortened URL", False, f"Exception: {e}")
            return None
            
    def test_create_custom_shortened_url(self):
        """Test POST /api/shorten with custom code"""
        print("\n=== Test 2: Create shortened URL with custom code ===")
        
        payload = {
            "original_url": "https://www.github.com",
            "custom_code": "github"
        }
        
        try:
            response = self.session.post(f"{self.base_url}/shorten", json=payload)
            
            if response.status_code != 200:
                self.log_test("Create custom shortened URL", False, f"Status code: {response.status_code}, Response: {response.text}")
                return None
                
            data = response.json()
            
            if data["short_code"] != "github":
                self.log_test("Create custom shortened URL", False, f"Wrong short_code: {data['short_code']}")
                return None
                
            if data["custom"] != True:
                self.log_test("Create custom shortened URL", False, f"Custom should be True, got: {data['custom']}")
                return None
                
            if data["original_url"] != "https://www.github.com":
                self.log_test("Create custom shortened URL", False, f"Wrong original_url: {data['original_url']}")
                return None
                
            self.created_urls.append(data)
            self.log_test("Create custom shortened URL", True, f"Created custom URL with code: {data['short_code']}")
            return data
            
        except Exception as e:
            self.log_test("Create custom shortened URL", False, f"Exception: {e}")
            return None
            
    def test_duplicate_custom_code(self):
        """Test POST /api/shorten with duplicate custom code - Should fail"""
        print("\n=== Test 3: Try to create duplicate custom code ===")
        
        payload = {
            "original_url": "https://www.example.com",
            "custom_code": "github"  # This should already exist from test 2
        }
        
        try:
            response = self.session.post(f"{self.base_url}/shorten", json=payload)
            
            if response.status_code == 400:
                data = response.json()
                if "already taken" in data.get("detail", "").lower():
                    self.log_test("Duplicate custom code rejection", True, "Correctly rejected duplicate code")
                    return True
                else:
                    self.log_test("Duplicate custom code rejection", False, f"Wrong error message: {data}")
                    return False
            else:
                self.log_test("Duplicate custom code rejection", False, f"Should return 400, got: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Duplicate custom code rejection", False, f"Exception: {e}")
            return False
            
    def test_get_all_urls(self):
        """Test GET /api/urls - Fetch all shortened URLs"""
        print("\n=== Test 4: Get all shortened URLs ===")
        
        try:
            response = self.session.get(f"{self.base_url}/urls")
            
            if response.status_code != 200:
                self.log_test("Get all URLs", False, f"Status code: {response.status_code}, Response: {response.text}")
                return None
                
            data = response.json()
            
            if not isinstance(data, list):
                self.log_test("Get all URLs", False, f"Response should be a list, got: {type(data)}")
                return None
                
            if len(data) < 2:
                self.log_test("Get all URLs", False, f"Should have at least 2 URLs, got: {len(data)}")
                return None
                
            # Check if sorted by created_at (newest first)
            if len(data) > 1:
                for i in range(len(data) - 1):
                    current_time = datetime.fromisoformat(data[i]["created_at"].replace("Z", "+00:00"))
                    next_time = datetime.fromisoformat(data[i+1]["created_at"].replace("Z", "+00:00"))
                    if current_time < next_time:
                        self.log_test("Get all URLs", False, "URLs not sorted by created_at (newest first)")
                        return None
                        
            self.log_test("Get all URLs", True, f"Retrieved {len(data)} URLs, properly sorted")
            return data
            
        except Exception as e:
            self.log_test("Get all URLs", False, f"Exception: {e}")
            return None
            
    def test_get_stats(self):
        """Test GET /api/stats/{short_code} - Get stats for a URL"""
        print("\n=== Test 5: Get URL statistics ===")
        
        if not self.created_urls:
            self.log_test("Get URL stats", False, "No URLs created to test stats")
            return None
            
        short_code = self.created_urls[0]["short_code"]
        
        try:
            response = self.session.get(f"{self.base_url}/stats/{short_code}")
            
            if response.status_code != 200:
                self.log_test("Get URL stats", False, f"Status code: {response.status_code}, Response: {response.text}")
                return None
                
            data = response.json()
            
            required_fields = ["short_code", "clicks", "original_url"]
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                self.log_test("Get URL stats", False, f"Missing fields: {missing_fields}")
                return None
                
            if data["short_code"] != short_code:
                self.log_test("Get URL stats", False, f"Wrong short_code: {data['short_code']}")
                return None
                
            self.log_test("Get URL stats", True, f"Stats for {short_code}: {data['clicks']} clicks")
            return data
            
        except Exception as e:
            self.log_test("Get URL stats", False, f"Exception: {e}")
            return None
            
    def test_redirect_and_increment(self):
        """Test GET /api/{short_code} - Redirect and increment clicks"""
        print("\n=== Test 6: Test redirect and click increment ===")
        
        if not self.created_urls:
            self.log_test("Redirect and increment", False, "No URLs created to test redirect")
            return None
            
        short_code = self.created_urls[0]["short_code"]
        
        try:
            # Get initial stats
            stats_response = self.session.get(f"{self.base_url}/stats/{short_code}")
            if stats_response.status_code != 200:
                self.log_test("Redirect and increment", False, "Could not get initial stats")
                return None
                
            initial_stats = stats_response.json()
            initial_clicks = initial_stats["clicks"]
            
            # Test redirect (don't follow redirects to avoid external requests)
            response = self.session.get(f"{self.base_url}/{short_code}", allow_redirects=False)
            
            if response.status_code not in [302, 307]:
                self.log_test("Redirect and increment", False, f"Should return 302 or 307 redirect, got: {response.status_code}")
                return None
                
            # Check if Location header is set correctly
            location = response.headers.get("Location")
            expected_url = self.created_urls[0]["original_url"]
            
            if location != expected_url:
                self.log_test("Redirect and increment", False, f"Wrong redirect URL. Expected: {expected_url}, Got: {location}")
                return None
                
            # Get updated stats
            stats_response = self.session.get(f"{self.base_url}/stats/{short_code}")
            if stats_response.status_code != 200:
                self.log_test("Redirect and increment", False, "Could not get updated stats")
                return None
                
            updated_stats = stats_response.json()
            updated_clicks = updated_stats["clicks"]
            
            if updated_clicks != initial_clicks + 1:
                self.log_test("Redirect and increment", False, f"Clicks not incremented. Initial: {initial_clicks}, Updated: {updated_clicks}")
                return None
                
            self.log_test("Redirect and increment", True, f"Redirect successful, clicks incremented from {initial_clicks} to {updated_clicks}")
            return True
            
        except Exception as e:
            self.log_test("Redirect and increment", False, f"Exception: {e}")
            return None
            
    def test_delete_url(self):
        """Test DELETE /api/urls/{short_code} - Delete a shortened URL"""
        print("\n=== Test 7: Delete shortened URL ===")
        
        # Find the github URL to delete
        github_url = None
        for url in self.created_urls:
            if url["short_code"] == "github":
                github_url = url
                break
                
        if not github_url:
            self.log_test("Delete URL", False, "Could not find github URL to delete")
            return None
            
        try:
            response = self.session.delete(f"{self.base_url}/urls/github")
            
            if response.status_code != 200:
                self.log_test("Delete URL", False, f"Status code: {response.status_code}, Response: {response.text}")
                return None
                
            data = response.json()
            
            if "message" not in data or "success" not in data["message"].lower():
                self.log_test("Delete URL", False, f"Unexpected response: {data}")
                return None
                
            # Verify URL is actually deleted by trying to get stats
            stats_response = self.session.get(f"{self.base_url}/stats/github")
            
            if stats_response.status_code != 404:
                self.log_test("Delete URL", False, f"URL still exists after deletion, stats returned: {stats_response.status_code}")
                return None
                
            self.log_test("Delete URL", True, "URL deleted successfully and verified")
            return True
            
        except Exception as e:
            self.log_test("Delete URL", False, f"Exception: {e}")
            return None
            
    def test_error_cases(self):
        """Test error cases"""
        print("\n=== Test 8: Error cases ===")
        
        # Test non-existent short code access
        try:
            response = self.session.get(f"{self.base_url}/nonexistent", allow_redirects=False)
            if response.status_code == 404:
                self.log_test("Non-existent code access", True, "Correctly returned 404 for non-existent code")
            else:
                self.log_test("Non-existent code access", False, f"Should return 404, got: {response.status_code}")
        except Exception as e:
            self.log_test("Non-existent code access", False, f"Exception: {e}")
            
        # Test delete non-existent URL
        try:
            response = self.session.delete(f"{self.base_url}/urls/nonexistent")
            if response.status_code == 404:
                self.log_test("Delete non-existent URL", True, "Correctly returned 404 for non-existent URL deletion")
            else:
                self.log_test("Delete non-existent URL", False, f"Should return 404, got: {response.status_code}")
        except Exception as e:
            self.log_test("Delete non-existent URL", False, f"Exception: {e}")
            
        # Test stats for non-existent URL
        try:
            response = self.session.get(f"{self.base_url}/stats/nonexistent")
            if response.status_code == 404:
                self.log_test("Stats for non-existent URL", True, "Correctly returned 404 for non-existent URL stats")
            else:
                self.log_test("Stats for non-existent URL", False, f"Should return 404, got: {response.status_code}")
        except Exception as e:
            self.log_test("Stats for non-existent URL", False, f"Exception: {e}")
            
    def run_all_tests(self):
        """Run all tests in sequence"""
        print(f"🚀 Starting URL Shortener API Tests")
        print(f"📍 Base URL: {self.base_url}")
        print("=" * 60)
        
        # Run tests in order
        self.test_create_shortened_url()
        self.test_create_custom_shortened_url()
        self.test_duplicate_custom_code()
        self.test_get_all_urls()
        self.test_get_stats()
        self.test_redirect_and_increment()
        self.test_delete_url()
        self.test_error_cases()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if total - passed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  • {result['test']}: {result['details']}")
                    
        return passed == total

if __name__ == "__main__":
    tester = URLShortenerTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)