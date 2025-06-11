import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthService } from '../service/auth/auth.service';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxSpinnerModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {

 

  constructor(
    private authService: AuthService,
    private spinner: NgxSpinnerService

  ) {}

  ngOnInit(): void {

   
  }


  dados(dados: NgForm){
    this.spinner.show();
    console.log(dados.form.value);
    this.authService.login(dados.form.value.email, dados.form.value.password)
   }
  }
